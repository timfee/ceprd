import type { Actor, Requirement } from "./schemas";

export interface ValidationResult {
  status: "PASS" | "FAIL";
  issue?: string;
  suggestion?: string;
}

const BANNED_WORDS = [
  "synergy",
  "paradigm shift",
  "leverage",
  "holistic",
  "disrupt",
  "game changer",
  "low hanging fruit",
];

const SENTENCE_SPLITTER = /[.!?]+/;
const WORD_SPLITTER = /\s+/;

/**
 * Deterministically validates a requirement before sending it to AI.
 * Checks for:
 * 1. Excessive length (> 40 words per sentence approx)
 * 2. Banned corporate jargon
 * 3. Basic completeness
 */
export function validateRequirementRules(
  req: Requirement,
  _actors: Actor[]
): ValidationResult {
  // Rule 1: Completeness
  if (!(req.title.trim() && req.description.trim())) {
    return {
      status: "FAIL",
      issue: "Requirement is incomplete.",
      suggestion: "Please provide both a title and a description.",
    };
  }

  // Rule 2: Banned Jargon
  const content = `${req.title} ${req.description}`.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (content.includes(word)) {
      return {
        status: "FAIL",
        issue: `Contains banned jargon: "${word}"`,
        suggestion: `Replace "${word}" with clearer, plain English.`,
      };
    }
  }

  // Rule 3: Sentence Length (Rough heuristic)
  const sentences = req.description.split(SENTENCE_SPLITTER);
  for (const sentence of sentences) {
    if (sentence.trim().split(WORD_SPLITTER).length > 40) {
      return {
        status: "FAIL",
        issue: "Sentence is too long (> 40 words).",
        suggestion:
          "Break complex sentences into smaller, testable statements.",
      };
    }
  }

  // Rule 4: Actor linkage
  // The UI enforces strict ID selection.

  return { status: "PASS" };
}
