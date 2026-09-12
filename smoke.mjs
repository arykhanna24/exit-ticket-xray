// smoke.mjs — run BEFORE 1:00. `node smoke.mjs`
// Verifies: key works, model reachable, JSON parses, every student classified.
// Then prints the actual grouping so you know if the prompt is any good
// before the build window opens.

import fs from 'node:fs';
import { SYSTEM_PROMPT, buildUserPrompt } from './src/prompt.js';

const KEY = (fs.readFileSync('.env.local', 'utf8').match(/VITE_ANTHROPIC_API_KEY=(.+)/) || [])[1]?.trim();
if (!KEY || KEY === 'PASTE_KEY_HERE') {
  console.error('FAIL: no key in .env.local');
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync('./data/seed.json', 'utf8'));

const t0 = Date.now();
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-5',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(seed) }],
  }),
});

if (!res.ok) {
  console.error(`FAIL: HTTP ${res.status}`);
  console.error(await res.text());
  console.error('\n401 = bad key. 429 = out of credits, get more from the event Discord.');
  process.exit(1);
}

const data = await res.json();
const text = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();

let out;
try {
  out = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
} catch (e) {
  console.error('FAIL: could not parse JSON. Raw response:\n', text.slice(0, 800));
  process.exit(1);
}

// contract check
const seen = [
  ...(out.correct_students || []),
  ...(out.groups || []).flatMap((g) => g.students || []),
  ...(out.unclassified || []),
];
const expected = seed.responses.map((r) => r.student);
const missing = expected.filter((s) => !seen.includes(s));
const dupes = seen.filter((s, i) => seen.indexOf(s) !== i);

console.log(`\nOK  ${((Date.now() - t0) / 1000).toFixed(1)}s  ${data.usage.output_tokens} output tokens`);
console.log(`    ${out.groups.length} groups, ${out.correct_students.length} correct, ${out.unclassified.length} unclassified`);
if (missing.length) console.log(`    WARN missing students: ${missing.join(', ')}`);
if (dupes.length) console.log(`    WARN duplicated students: ${dupes.join(', ')}`);

console.log('\n--- grouping (read this by hand against data/ground_truth.csv) ---');
for (const g of out.groups) {
  console.log(`\n[${g.misconception_id}] ${g.label}`);
  console.log(`  ${g.students.join(', ')}`);
  console.log(`  reteach: ${g.reteach.plan.slice(0, 100)}...`);
}
console.log(`\nunclassified: ${out.unclassified.join(', ') || '(none)'}`);

// write predicted.csv for the R eval
const rows = [['student', 'predicted_group']];
out.correct_students.forEach((s) => rows.push([s, 'correct']));
out.groups.forEach((g) => g.students.forEach((s) => rows.push([s, g.misconception_id])));
out.unclassified.forEach((s) => rows.push([s, 'unclassified']));
fs.writeFileSync('./eval/predicted.csv', rows.map((r) => r.join(',')).join('\n'));
console.log('\nwrote eval/predicted.csv  ->  cd eval && Rscript score.R');
