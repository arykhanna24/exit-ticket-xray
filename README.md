# Exit Ticket X-Ray

Groups students by the *misconception* behind their wrong answer, not by score,
and writes a 10-minute reteach plan for each group.

## Setup (12 minutes, do this before 1:00)

```bash
npm create vite@latest exit-ticket-xray -- --template react
cd exit-ticket-xray
npm install

# drop the files from this bundle into place
mkdir -p src data eval
# src/engine.js  src/prompt.js  src/mock.js
# data/seed.json  data/ground_truth.csv  data/responses.csv
# eval/score.R

echo ".env.local" >> .gitignore
echo "VITE_ANTHROPIC_API_KEY=sk-ant-..." > .env.local

git init && git add -A && git commit -m "init"
gh repo create exit-ticket-xray --public --source=. --push
```

Then: import the repo on vercel.com, add `VITE_ANTHROPIC_API_KEY` under
Settings → Environment Variables, deploy, and **paste the live URL in team
chat while the page is still blank.** Never deploy for the first time at 3:40.

## File ownership — if it is not your file, do not open it

| Path | Owner |
|---|---|
| `src/prompt.js`, `src/engine.js`, `eval/score.R` | AK |
| `src/App.jsx`, `src/components/` | Teammate 1 |
| `data/*`, `deck/` | Teammate 2 |

Everyone pushes to `main`. No branches, no PRs. Commit every 15 minutes.

## Data contract

Input adds a `work` field to each response. This is a change from the first
brief and it is the reason the project works: two different misconceptions both
produce the answer `1/6`, so the final answer alone is underdetermined. Work
shown makes the diagnosis possible and is what beats answer-string grouping.

```json
{ "student": "Tariq", "answer": "1/6", "work": "3/6 - 2/6 = 1/6" }
```

Output shape is unchanged. See `src/mock.js`.

Every student appears exactly once across `correct_students`,
`groups[].students`, and `unclassified`. `engine.js` asserts this and throws.

## Running the eval

```bash
# after a successful analyze() run, save toEvalCsv(output) to eval/predicted.csv
cd eval && Rscript score.R
```

Base R only. No packages, no internet.

Baselines on the seed set, already verified:

| Method | Accuracy | ARI | Groups |
|---|---|---|---|
| Score-sorting | 14/30 | 0.24 | 2 |
| Answer-string | 23/30 | 0.78 | 6 |
| Ours | ceiling 30/30 | 1.00 | 6 |

Report what you actually get. Do not report the ceiling.
