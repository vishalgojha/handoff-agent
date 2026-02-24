#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

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
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "project";
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

function readAnswersFromPipedInput(expectedCount) {
  const raw = fs.readFileSync(0, "utf8");
  const lines = raw.split(/\r?\n/).map((line) => line.trim());
  const answers = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }
    answers.push(line);
    if (answers.length === expectedCount) {
      break;
    }
  }

  if (answers.length < expectedCount) {
    throw new Error(
      `Expected ${expectedCount} non-empty answers from stdin, received ${answers.length}.`
    );
  }

  return answers;
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

function buildOutput(now, answers) {
  const [project, instructed, shipped, openItems, nextInstruction] = answers;
  const today = toDateString(now);

  return [
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
    const datePart = toDateString(now);
    const projectSlug = toProjectSlug(answers[0]);
    const notesDir = path.join(process.cwd(), "NOTES");

    fs.mkdirSync(notesDir, { recursive: true });

    const baseName = `${datePart}_${projectSlug}-handoff.md`;
    let fileName = baseName;
    let outputPath = path.join(notesDir, fileName);

    if (fs.existsSync(outputPath)) {
      const stampedName = `${datePart}_${projectSlug}-handoff_${toTimeString(now)}.md`;
      fileName = stampedName;
      outputPath = path.join(notesDir, fileName);
    }

    const output = buildOutput(now, answers);
    fs.writeFileSync(outputPath, output, "utf8");

    console.log("Handoff saved:");
    console.log(path.relative(process.cwd(), outputPath));
  } catch (error) {
    console.error("Failed to create handoff:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();
