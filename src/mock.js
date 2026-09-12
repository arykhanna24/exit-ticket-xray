// mock.js — Teammate 1 builds the entire UI against this, starting at 1:00.
// Do NOT wait for the real engine. At 2:00 we swap `MOCK_OUTPUT` for
// `await analyze(seed)` and nothing else changes.

export const MOCK_OUTPUT = {
  correct_students: ['Maya', 'Sofia', 'Amara', 'Dev', 'Ines', 'Tobias', 'Nadia', 'Ruth'],
  groups: [
    {
      misconception_id: 'add_across',
      label: 'Adds numerators and denominators separately',
      explanation: 'Treats fraction addition as componentwise, so 1/2 + 1/3 becomes (1+1)/(2+3).',
      students: ['Jake', 'Ben', 'Carlos', 'Hana', 'Omar', 'Zoe'],
      reteach: {
        duration_min: 10,
        plan: 'Fraction strips. Lay 1/2 and 1/3 end to end against 2/5 and let them see 2/5 is smaller than 1/2 alone, so the answer is impossible by size before any arithmetic.',
        practice_questions: ['1/4 + 1/2', '2/3 + 1/6', '1/5 + 3/10'],
      },
    },
    {
      misconception_id: 'multiply_instead_of_add',
      label: 'Applies the multiplication procedure to an addition problem',
      explanation: 'Knows a valid fraction rule but selects the wrong one, multiplying across instead of adding.',
      students: ['Priya', 'Leo', 'Yuki', 'Marco', 'Aisha'],
      reteach: {
        duration_min: 10,
        plan: 'Operation sorting. Give twelve mixed problems and have them only circle add or multiply, no solving. Then ask what each operation does to the size of the result.',
        practice_questions: ['Name the operation: 2/3 ? 1/4 = 1/6', '1/2 + 1/4', '1/2 × 1/4'],
      },
    },
    {
      misconception_id: 'lcd_numerators_unchanged',
      label: 'Converts denominators but leaves numerators untouched',
      explanation: 'Correctly finds the common denominator of 6 but rewrites both fractions as 1/6, losing the scaling step.',
      students: ['Ravi', 'Elena', 'Samir', 'Kofi', 'Lina', 'Noor'],
      reteach: {
        duration_min: 10,
        plan: 'Scale the whole fraction, not half of it. Show 1/2 = 3/6 on a number line and ask what happened to the top when the bottom tripled.',
        practice_questions: ['Rewrite 2/3 with denominator 12', '3/4 + 1/8', '2/5 + 1/10'],
      },
    },
    {
      misconception_id: 'subtract_after_lcd',
      label: 'Finds the common denominator, then subtracts instead of adding',
      explanation: 'Procedure is correct through conversion, but the operation flips at the final step.',
      students: ['Tariq', 'Mei', 'Diego', 'Hannah'],
      reteach: {
        duration_min: 10,
        plan: 'Estimate before solving. Ask whether the answer should be bigger or smaller than 1/2, commit to it out loud, then solve and check against the prediction.',
        practice_questions: ['1/2 + 1/4 (predict first)', '2/3 + 1/6 (predict first)', '5/8 + 1/4'],
      },
    },
  ],
  unclassified: ['Felix'],
};

// What Teammate 1 renders alongside the groups, for the evidence moment.
export const MOCK_BASELINE = {
  score_sort: { correct: 14, total: 30, groups: 2 },
  answer_string: { correct: 23, total: 30, groups: 6 },
  ours: { correct: 30, total: 30, groups: 6 },
};
