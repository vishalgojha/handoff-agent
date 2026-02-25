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

## Install the skill from this repo

If you are using Codex skill installation from GitHub paths, install from:

- `skills/blindspot-supervisor`

Then restart Codex so the skill is picked up.

## Publish to npm

1. `npm login`
2. `npm publish --access public`

If the package name is already taken in npm, change `"name"` in `package.json` before publishing.
