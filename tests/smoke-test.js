"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  createHandoff,
  parseAnswersFromText,
  toProjectSlug,
} = require("../index.js");

function runSmokeTest() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-agent-"));
  const notesDir = path.join(tmpDir, "NOTES");

  try {
    const answers = [
      "Project Phoenix",
      "Implement CLI prompts and handoff writer",
      "Shipped initial CLI and markdown output",
      "Needs better tests and publish dry run",
      "Run npm pack and inspect tarball",
    ];
    const now = new Date(2026, 1, 25, 3, 45, 16);

    const firstPath = createHandoff(tmpDir, now, answers);
    const secondPath = createHandoff(tmpDir, now, answers);
    const thirdPath = createHandoff(tmpDir, now, answers);

    assert.ok(fs.existsSync(notesDir), "NOTES folder should be created.");
    const files = fs.readdirSync(notesDir).sort();
    assert.strictEqual(files.length, 3, "Three runs should create three handoff files.");
    assert.ok(path.basename(firstPath).endsWith("-handoff.md"), "First file should use base name.");
    assert.ok(
      /-handoff_\d{6}\.md$/.test(path.basename(secondPath)),
      "Second file should use timestamp suffix."
    );
    assert.ok(
      /-handoff_\d{6}-1\.md$/.test(path.basename(thirdPath)),
      "Third file should use incremented suffix on timestamp collision."
    );

    const firstBody = fs.readFileSync(firstPath, "utf8");
    assert.ok(firstBody.startsWith("---\n"), "Output should include YAML frontmatter.");
    assert.ok(firstBody.includes("handoff_version: 1"), "Output should include handoff version.");
    assert.ok(firstBody.includes("## Agent Session Handoff"), "Output should include handoff heading.");
    assert.ok(
      files.includes(path.basename(secondPath)) && files.includes(path.basename(thirdPath)),
      "Created paths should exist in NOTES."
    );

    assert.throws(
      () => parseAnswersFromText("Project One\n\nShipped thing\nOpen issue\nNext step\n", 5),
      /Answer 2 cannot be blank/,
      "Blank piped answers should fail and identify position."
    );

    assert.deepStrictEqual(
      parseAnswersFromText("A\nB\nC\nD\nE\n", 5),
      ["A", "B", "C", "D", "E"],
      "Valid piped answers should be parsed in order."
    );

    assert.strictEqual(
      toProjectSlug("Проект Агент"),
      "проект-агент",
      "Unicode project names should produce stable slugs."
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runSmokeTest();
console.log("Smoke test passed.");
