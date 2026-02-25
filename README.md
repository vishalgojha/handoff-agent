# Your agents forget everything. handoff-agent doesn't.

Capture a clean end-of-session handoff that is ready to paste into your next AI-agent run.

`npx handoff-agent`

## What it does

- Asks 5 required questions about your current session.
- Blocks empty answers until valid input is provided.
- Supports multiline answers by entering `"""` to start and `"""` again to finish.
- Writes a structured markdown handoff to `./NOTES/`.
- Uses filename format: `YYYY-MM-DD_[project-name]-handoff.md`.
- Appends a timestamp if that date+project file already exists.

## Output format

The generated file is a context block designed to be pasted directly into the next agent session:

- YAML frontmatter for machine parsing (`handoff_version`, `date`, `project_slug`, etc.)
- Project and date metadata
- What was instructed
- What shipped
- What remains open
- Single next best instruction
- A copy/paste continuation line for the next run

## Validate locally

`npm test`

## Multiline answers

When prompted, enter `"""` on its own line to start multiline mode, type your answer, then enter `"""` again on its own line to finish.

## Local usage

1. Run `npx handoff-agent`
2. Answer the prompts
3. Open the generated file under `./NOTES/` and paste it into your next session

## Codex skill included

This repo now includes a Codex skill at `skills/blindspot-supervisor`.

It provides proactive second-pass supervision in the same conversation:

- fills high-impact technical/process/product blind spots
- adds missing constraints and risk checks
- explains background decisions in a concise 4-part format

This repo also includes a parallel coaching skill at `skills/learning-supervisor`.

It keeps coding momentum while teaching in small practical steps:

- plain-English step intent
- exact action executed
- proof from command/test/diff
- short why/tradeoff explanation
- single next move

## Tandem workflow (recommended)

1. Start your build session in Codex with:
   - `blindspot mode: <task>`
2. Build with supervision during the session.
3. At the end, run:
   - `npx handoff-agent`
4. Paste the generated handoff into the next session and continue again with `blindspot mode`.

## One-command chaining prompt

Use this prompt when you want both behaviors chained in one run:

`blindspot mode chain: use the appropriate execution skill for the task, run blindspot-supervisor as second-pass quality control, then end with session-close instructions for npx handoff-agent.`

## Learning-agent prompt (copy/paste)

Use this when you want Codex to act like a practical learning coach while still shipping:

`learning mode chain: I am not a coder. Build this with me in tiny steps. For each step: (1) say what will change in plain English, (2) run the command or edit, (3) show pass/fail evidence, (4) explain why in 2-4 lines, and (5) tell me exactly what to do next. Do not change UX or command names without asking first. Keep diffs small, run tests frequently, and if blocked, give one fallback path. End by telling me to run npx handoff-agent.`

## Alternative prompt ideas

1. `teacher mode chain: explain the concept first, then implement, then quiz me with 2 short checks before moving on.`
2. `flight-recorder mode chain: after each change, output files touched, risk level, and rollback command in plain English.`
3. `safe-release mode chain: do preflight checks, build, smoke test, deploy, and stop on first failure with root-cause notes.`

## Install the skill from this repo

If you are using Codex skill installation from GitHub paths, install from:

- `skills/blindspot-supervisor`
- `skills/learning-supervisor`

Then restart Codex so the skill is picked up.

Trigger prompts:

- `blindspot mode chain: <your task>`
- `learning mode chain: <your task>`
- `parallel mode chain: use learning-supervisor for step-by-step coaching and blindspot-supervisor for second-pass risk checks while executing <your task>.`

## Publish to npm

1. `npm login`
2. `npm publish --access public`

If the package name is already taken in npm, change `"name"` in `package.json` before publishing.
