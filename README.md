# Your agents forget everything. handoff-agent doesn't.

Capture a clean end-of-session handoff that is ready to paste into your next AI-agent run.

`npx handoff-agent`

## What it does

- Asks 5 required questions about your current session.
- Blocks empty answers until valid input is provided.
- Writes a structured markdown handoff to `./NOTES/`.
- Uses filename format: `YYYY-MM-DD_[project-name]-handoff.md`.
- Appends a timestamp if that date+project file already exists.

## Output format

The generated file is a context block designed to be pasted directly into the next agent session:

- Project and date metadata
- What was instructed
- What shipped
- What remains open
- Single next best instruction
- A copy/paste continuation line for the next run

## Local usage

1. Run `npx handoff-agent`
2. Answer the prompts
3. Open the generated file under `./NOTES/` and paste it into your next session

## Publish to npm

1. `npm login`
2. `npm publish --access public`

If the package name is already taken in npm, change `"name"` in `package.json` before publishing.
