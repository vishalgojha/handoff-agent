#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");

const MULTILINE_MARKER = '"""';

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

function validateAnswers(answers, expectedCount) {
  if (!Array.isArray(answers)) {
    throw new TypeError("Answers must be provided as an array.");
  }

  if (answers.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} answers, received ${answers.length}.`);
  }

  return answers.map((answer, index) => {
    if (typeof answer !== "string") {
      throw new TypeError(`Answer ${index + 1} must be a string.`);
    }

    const value = answer.trim();
    if (!value) {
      throw new Error(`Answer ${index + 1} cannot be blank.`);
    }

    return value;
  });
}

function readMultilineAnswer(rl) {
  return new Promise((resolve) => {
    const lines = [];

    const readNextLine = () => {
      rl.question("> ", (line) => {
        if (line.trim() === MULTILINE_MARKER) {
          resolve(lines.join("\n").trim());
          return;
        }

        lines.push(line);
        readNextLine();
      });
    };

    readNextLine();
  });
}

function askQuestion(rl, promptText) {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(`${promptText}\n> `, (answer) => {
        const value = answer.trim();
        if (value === MULTILINE_MARKER) {
          console.log(`Multiline mode: type your response, then end with ${MULTILINE_MARKER}.\n`);
          readMultilineAnswer(rl).then((multilineValue) => {
            if (!multilineValue) {
              console.log("Answer cannot be blank. Please try again.\n");
              ask();
              return;
            }

            resolve(multilineValue);
          });
          return;
        }

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

  const answers = [];
  let lineIndex = 0;

  while (answers.length < expectedCount) {
    if (lineIndex >= lines.length) {
      throw new Error(
        `Expected ${expectedCount} answers from stdin, received ${answers.length}.`
      );
    }

    const currentLine = lines[lineIndex];
    const trimmedLine = currentLine.trim();

    if (trimmedLine === MULTILINE_MARKER) {
      lineIndex += 1;
      const blockLines = [];
      let closed = false;

      while (lineIndex < lines.length) {
        const blockLine = lines[lineIndex];
        if (blockLine.trim() === MULTILINE_MARKER) {
          closed = true;
          lineIndex += 1;
          break;
        }

        blockLines.push(blockLine);
        lineIndex += 1;
      }

      if (!closed) {
        throw new Error(`Unterminated multiline answer for answer ${answers.length + 1}.`);
      }

      const blockValue = blockLines.join("\n").trim();
      if (!blockValue) {
        throw new Error(`Answer ${answers.length + 1} cannot be blank.`);
      }

      answers.push(blockValue);
      continue;
    }

    if (!trimmedLine) {
      throw new Error(`Answer ${answers.length + 1} cannot be blank.`);
    }

    answers.push(trimmedLine);
    lineIndex += 1;
  }

  const hasExtraInput = lines.slice(lineIndex).some((line) => line.trim() !== "");
  if (hasExtraInput) {
    throw new Error(`Expected exactly ${expectedCount} answers from stdin, but received extra input.`);
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
  const [project, instructed, shipped, openItems, nextInstruction] = validateAnswers(
    answers,
    questions.length
  );
  const today = toDateString(now);
  const safeProjectSlug =
    typeof projectSlug === "string" && projectSlug.trim() ? projectSlug.trim() : toProjectSlug(project);

  return [
    "---",
    "handoff_version: 1",
    `created_at: ${now.toISOString()}`,
    `date: ${today}`,
    `project: ${yamlQuote(project)}`,
    `project_slug: ${safeProjectSlug}`,
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
  if (typeof cwd !== "string" || !cwd.trim()) {
    throw new TypeError("A valid current working directory is required.");
  }

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("A valid Date instance is required.");
  }

  const validatedAnswers = validateAnswers(answers, questions.length);
  const datePart = toDateString(now);
  const projectSlug = toProjectSlug(validatedAnswers[0]);
  const notesDir = path.join(cwd, "NOTES");

  fs.mkdirSync(notesDir, { recursive: true });

  const output = buildOutput(now, validatedAnswers, projectSlug);
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
  validateAnswers,
  writeUniqueOutputFile,
};
