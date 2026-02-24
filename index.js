#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");

const questions = [
  "1. What project/agent is this for?",
  "2. What did you instruct the agent to do today?",
  "3. What did the agent ship or complete?",
  "4. What failed, got skipped, or is still open?",
  "5. What's the single best next instruction for the next session?",
];

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeString(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}${minutes}${seconds}`;
}

function toProjectSlug(input) {
  const normalized = input.normalize("NFKC").toLowerCase();
  const slug = normalized
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  if (slug) {
    return slug;
  }
  const hash = crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 8);
  return `project-${hash}`;
}

function yamlQuote(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function askQuestion(rl, promptText) {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(`${promptText}\n> `, (answer) => {
        const value = answer.trim();
        if (!value) {
          console.log("Answer cannot be blank. Please try again.\n");
          ask();
          return;
        }
        resolve(value);
      });
    };
    ask();
  });
}

function parseAnswersFromText(raw, expectedCount) {
  const lines = raw.split(/\r?\n/);

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  if (lines.length < expectedCount) {
    throw new Error(
      `Expected ${expectedCount} answers from stdin, received ${lines.length}.`
    );
  }

  const answers = lines.slice(0, expectedCount).map((line) => line.trim());
  const blankIndex = answers.findIndex((answer) => !answer);
  if (blankIndex !== -1) {
    throw new Error(`Answer ${blankIndex + 1} cannot be blank.`);
  }

  return answers;
}

function readAnswersFromPipedInput(expectedCount) {
  const raw = fs.readFileSync(0, "utf8");
  return parseAnswersFromText(raw, expectedCount);
}

function writeUniqueOutputFile(notesDir, baseStem, output, timestamp) {
  let suffixAttempt = 0;

  while (true) {
    let fileName = `${baseStem}.md`;
    if (suffixAttempt >= 1) {
      fileName = `${baseStem}_${timestamp}.md`;
    }
    if (suffixAttempt >= 2) {
      fileName = `${baseStem}_${timestamp}-${suffixAttempt - 1}.md`;
    }

    const outputPath = path.join(notesDir, fileName);
    try {
      fs.writeFileSync(outputPath, output, { encoding: "utf8", flag: "wx" });
      return outputPath;
    } catch (error) {
      if (error && error.code === "EEXIST") {
        suffixAttempt += 1;
        continue;
      }
      throw error;
    }
  }
}

async function collectAnswers(rl) {
  if (!process.stdin.isTTY) {
    return readAnswersFromPipedInput(questions.length);
  }

  const answers = [];
  for (const question of questions) {
    const answer = await askQuestion(rl, question);
    answers.push(answer);
    console.log("");
  }

  return answers;
}

function buildOutput(now, answers, projectSlug) {
  const [project, instructed, shipped, openItems, nextInstruction] = answers;
  const today = toDateString(now);

  return [
    "---",
    "handoff_version: 1",
    `created_at: ${now.toISOString()}`,
    `date: ${today}`,
    `project: ${yamlQuote(project)}`,
    `project_slug: ${projectSlug}`,
    "---",
    "",
    "<!-- Paste this whole block into the next AI agent session -->",
    "## Agent Session Handoff",
    "",
    `Date: ${today}`,
    `Project/Agent: ${project}`,
    "",
    "### What I asked the agent to do today",
    instructed,
    "",
    "### What the agent shipped/completed",
    shipped,
    "",
    "### What failed/skipped/still open",
    openItems,
    "",
    "### Single best next instruction",
    nextInstruction,
    "",
    "### Copy/Paste Instruction",
    "Continue this project from this handoff. Preserve shipped work, resolve open items, and execute the next instruction first.",
    "",
  ].join("\n");
}

function createHandoff(cwd, now, answers) {
  const datePart = toDateString(now);
  const projectSlug = toProjectSlug(answers[0]);
  const notesDir = path.join(cwd, "NOTES");

  fs.mkdirSync(notesDir, { recursive: true });

  const output = buildOutput(now, answers, projectSlug);
  const baseStem = `${datePart}_${projectSlug}-handoff`;
  const outputPath = writeUniqueOutputFile(notesDir, baseStem, output, toTimeString(now));
  return outputPath;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY && process.stdout.isTTY,
  });

  try {
    console.log("\nCreate a handoff context block for your next agent session.\n");

    const answers = await collectAnswers(rl);

    const now = new Date();
    const outputPath = createHandoff(process.cwd(), now, answers);

    console.log("Handoff saved:");
    console.log(path.relative(process.cwd(), outputPath));
  } catch (error) {
    console.error("Failed to create handoff:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildOutput,
  createHandoff,
  parseAnswersFromText,
  readAnswersFromPipedInput,
  toProjectSlug,
  writeUniqueOutputFile,
};
