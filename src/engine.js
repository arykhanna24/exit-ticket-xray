// engine.js — AK owns this file.
// One API call, one parse, one validation. Nothing else belongs here.

import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export async function analyze(input) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed = parseLoose(text);
  validate(parsed, input);
  return parsed;
}

// The model is told not to use fences. It will sometimes use fences.
function parseLoose(text) {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found in response');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

// Run this before anything reaches the projector.
function validate(out, input) {
  const seen = [
    ...(out.correct_students || []),
    ...(out.groups || []).flatMap((g) => g.students || []),
    ...(out.unclassified || []),
  ];
  const expected = input.responses.map((r) => r.student);

  const missing = expected.filter((s) => !seen.includes(s));
  const dupes = seen.filter((s, i) => seen.indexOf(s) !== i);

  if (missing.length) throw new Error(`Students missing from output: ${missing.join(', ')}`);
  if (dupes.length) throw new Error(`Students appearing twice: ${dupes.join(', ')}`);
}

// Baseline 1: what teachers do today. Everyone wrong goes in one pile.
export function baselineScoreSort(input) {
  const wrong = input.responses.filter((r) => !sameValue(r.answer, input.correct_answer));
  return [{ label: 'Needs help', students: wrong.map((r) => r.student) }];
}

// Baseline 2: the steelman. Group by matching answer string.
export function baselineAnswerString(input) {
  const buckets = {};
  for (const r of input.responses) {
    if (sameValue(r.answer, input.correct_answer)) continue;
    (buckets[r.answer] ||= []).push(r.student);
  }
  return Object.entries(buckets).map(([label, students]) => ({ label, students }));
}

function sameValue(a, b) {
  return String(a).trim() === String(b).trim();
}

// Dump predicted labels for the R eval. Paste output into eval/predicted.csv.
export function toEvalCsv(out) {
  const rows = [['student', 'predicted_group']];
  (out.correct_students || []).forEach((s) => rows.push([s, 'correct']));
  (out.groups || []).forEach((g) =>
    (g.students || []).forEach((s) => rows.push([s, g.misconception_id]))
  );
  (out.unclassified || []).forEach((s) => rows.push([s, 'unclassified']));
  return rows.map((r) => r.join(',')).join('\n');
}
