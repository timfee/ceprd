"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

import { type RequirementSchema } from "@/lib/schemas";
import { HUMANIZER_PROMPT } from "@/lib/prompts";

import {
  COMMON_TERMS,
  CONTEXT_CATEGORIES,
  PERSONA_ROLES,
} from "@/lib/repository";

/**
 * Performs research on the competitive landscape.
 * Returns a structured list of competitors with SWOT analysis.
 */
export async function performCompetitiveResearch(productIdea: string) {
  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
    output: Output.object({
      schema: z.object({
        competitors: z.array(
          z.object({
            analysis: z.string(),
            featureGaps: z.array(z.string()),
            name: z.string(),
            strengths: z.array(z.string()),
            url: z.string().optional(),
            weaknesses: z.array(z.string()),
          })
        ),
      }),
    }),
    prompt: `
      Research the competitive landscape for this product idea: "${productIdea}".
      
      CRITICAL: You are an expert strategist for Google Chrome Enterprise Premium.
      Focus on direct competitors in the Enterprise Browser, SSE (Security Service Edge), and DLP markets.
      
      Specific Competitors to Consider (if relevant):
      - Zscaler
      - Island.io
      - Talon Cyber Security
      - Netskope
      - CrowdStrike
      
      Identify the top 3 direct competitors.
      For each, provide a prose analysis of their market position relative to Chrome Enterprise.
      Then list their key strengths, weaknesses, and specific features they have that we might be missing.
      
      Return a structured list of competitors.
    `,
  });

  return output.competitors;
}

/**
 * Generates content for specific PRD sections or sub-sections.
 */
export async function generateSectionContent(
  section: "tldr" | "background" | "tldr:problem" | "tldr:solution",
  context: { title: string; actors: { name: string; role: string }[] },
  instruction?: "Make longer" | "Make shorter" | "Rewrite" | "Remove AI Slop"
) {
  const isHumanizer = instruction === "Remove AI Slop";
  const systemPrompt = isHumanizer ? HUMANIZER_PROMPT : undefined;

  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    output: Output.object({
      schema: z.object({
        background: z
          .object({
            context: z.string(),
            marketDrivers: z.array(z.string()),
          })
          .optional(),
        tldr: z
          .object({
            problem: z.string().optional(),
            solution: z.string().optional(),
          })
          .optional(),
      }),
    }),
    prompt: `
      ${
        isHumanizer
          ? `Humanize the content for the "${section}" section of the PRD.`
          : `Generate the content for the "${section}" section of a Product Requirements Document (PRD).`
      }
      
      Project Title: "${context.title}"
      Key Actors: ${context.actors.map((a) => `${a.name} (${a.role})`).join(", ")}
      
      ${
        instruction && !isHumanizer
          ? `Refinement Instruction: "${instruction}" - Please follow this instruction strictly when generating the content.`
          : ""
      }
      
      ${
        isHumanizer
          ? `Please rewrite the existing content (or generate new content if none exists) following the Humanizer guidelines to remove AI patterns and make it sound authentic.`
          : ""
      }

      Instructions:
      ${
        section === "tldr" ||
        section === "tldr:problem" ||
        section === "tldr:solution"
          ? `- For 'tldr', focus on the Core Problem and Proposed Solution.`
          : ""
      }
      ${
        section === "tldr:problem"
          ? `- ONLY generate the 'problem' field (write ~2 paragraphs detailing the core pain points and impact).`
          : ""
      }
      ${
        section === "tldr:solution"
          ? `- ONLY generate the 'solution' field (write ~2 paragraphs detailing the approach and key benefits).`
          : ""
      }
      ${
        section === "background"
          ? `- Return a JSON object with 'context' and 'marketDrivers'.`
          : ""
      }
    `,
    system: systemPrompt,
  });

  return output;
}

/**
 * Analyzes a raw idea dump to extract structured PRD metadata.
 * Useful for initializing a new PRD from a brain dump.
 */
export async function generateIdeaDumpStructure(
  idea: string,
  progressCallback?: (step: number, message: string) => void
) {
  console.log("generateIdeaDumpStructure started with idea:", idea);

  progressCallback?.(0, "Analyzing product idea...");

  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
    output: Output.object({
      schema: z.object({
        background: z.object({
          context: z.string(),
          marketDrivers: z.array(z.string()),
        }),
        suggestedActors: z.array(
          z.object({
            name: z.string(),
            priority: z.enum(["Primary", "Secondary", "Tertiary"]),
            role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
          })
        ),
        suggestedGoals: z.array(
          z.object({
            description: z.string(),
            priority: z.enum(["Critical", "High", "Medium"]),
            title: z.string(),
          })
        ),
        suggestedMilestones: z.array(
          z.object({
            targetDate: z.string(),
            title: z.string(),
          })
        ),
        suggestedRequirements: z.array(
          z.object({
            description: z.string(),
            primaryActorName: z
              .string()
              .optional()
              .describe("Must match a name from suggestedActors"),
            priority: z.enum(["P0", "P1", "P2", "P3"]),
            title: z.string(),
            type: z.enum([
              "User Story",
              "System Behavior",
              "Constraint",
              "Interface",
            ]),
          })
        ),
        suggestedTerms: z.array(
          z.object({
            definition: z.string(),
            term: z.string(),
          })
        ),
        title: z.string(),
        tldr: z.object({
          problem: z.string(),
          solution: z.string(),
          valueProps: z.array(z.string()),
        }),
      }),
    }),
    prompt: `Analyze this product idea and extract initial structure: "${idea}". 
    
    IMPORTANT: Think step-by-step and show your reasoning process:
    
    1. First, analyze the core problem this solves and the target users
    2. Identify the key stakeholders and user personas. 
       - REFERENCE these known roles if applicable: ${PERSONA_ROLES.join(", ")}.
    3. Determine the primary functional requirements.
       - You MUST link each requirement to a primary actor from your identified list.
    4. Define success metrics and project goals
    5. Plan realistic project milestones
    6. Extract relevant technical terminology and acronyms
    
    CRITICAL QUALITY CHECK:
    - Before finalizing the output, review all generated text fields (problem, solution, descriptions).
    - Ensure they do NOT sound like generic AI fluff. 
    - Use the following Humanizer principles to evaluate your own output:
    ${HUMANIZER_PROMPT}
    - If you detect any "AI Slop" patterns (like "testament to", "delve", "landscape", "fostering"), REWRITE them to be more direct, human, and professional.

    For Suggested Terms:
    - Identify key technical acronyms (e.g. ZTNA, DLP) and specific product names.
    - Bias towards Google / Chrome Enterprise Premium terminology.
    - EXCLUDE these common terms: ${COMMON_TERMS.join(", ")}.

    For Background:
    - Provide initial Context and Market Drivers.
    - Consider these strategic contexts if relevant: ${CONTEXT_CATEGORIES.map((c) => c.label).join(", ")}.

    For Requirements:
    - Generate specific, testable functional requirements based on the idea.
    - CRITICAL: Assign a 'primaryActorName' to every requirement. It must match one of the 'name' fields in 'suggestedActors'.
    
    Return a valid JSON object matching the schema.
    `,
  });

  console.log("Gemini response received");

  progressCallback?.(1, "Project structure defined");
  progressCallback?.(2, "Identifying key actors and personas");
  progressCallback?.(3, "Generating functional requirements");
  progressCallback?.(4, "Creating project milestones");
  progressCallback?.(5, "Setting up terminology glossary");
  progressCallback?.(6, "Draft generation completed!");

  return output;
}

/**
 * Scans the provided PRD content and identifies potential glossary terms.
 * Biased towards Google/Chrome Enterprise Premium terminology.
 */
export async function identifyPotentialTerms(
  content: string,
  existingTerms: string[]
) {
  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
    output: Output.object({
      schema: z.object({
        terms: z.array(
          z.object({
            definition: z.string(),
            term: z.string(),
          })
        ),
      }),
    }),
    prompt: `
      Analyze the following PRD content and identify 3-5 potential glossary terms that are missing from the current list.
      
      Current Glossary Terms: ${existingTerms.join(", ")}
      
      Content to Scan:
      "${content}"
      
      Guidelines:
      1. Focus on technical terms, acronyms (e.g. ZTNA, DLP), or product-specific concepts.
      2. Bias towards official Google / Chrome Enterprise Premium terminology.
      3. CRITICAL: Do NOT suggest generic words or headers like "User", "Admin", "TL;DR", "Background", "Requirements", "Goals", "Overview".
      4. DO NOT suggest these common terms: ${COMMON_TERMS.join(", ")}.
      5. Provide a concise definition for each term.
      
      Return a JSON array of terms.
    `,
  });

  return output.terms;
}

/**
 * Generates a requirement description based on the title and context.
 */
export async function generateRequirementDescription(
  title: string,
  type: string,
  actors: { name: string; role: string }[],
  context?: {
    background?: string;
    competitorContext?: string[];
    goals?: string[];
    glossary?: string[];
  }
) {
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `
      Write a professional, concise product requirement description for a feature titled: "${title}".
      Type: ${type}
      
      Primary Actors available: ${actors.map((a) => a.name).join(", ")}
      
      ${context?.background ? `Project Background: "${context.background}"` : ""}
      ${
        context?.competitorContext?.length
          ? `Competitive Insights to Consider:\n- ${context.competitorContext.join("\n- ")}`
          : ""
      }
      ${
        context?.goals?.length
          ? `Align with these Project Goals:\n- ${context.goals.join("\n- ")}`
          : ""
      }
      ${
        context?.glossary?.length
          ? `Use these Glossary Terms correctly:\n- ${context.glossary.join(", ")}`
          : ""
      }

      Instructions:
      - Format as a user story ("As a [Actor], I want to...") OR a system behavior ("The system shall...").
      - Be specific and testable.
      - Explicitly reference the competitive gap or project goal if relevant.
      - Keep it under 4 sentences.
    `,
  });

  return output;
}

/**
 * Refines any text based on an instruction.
 */
export async function refineText(
  text: string,
  instruction: string,
  context?: string
) {
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `
      You are an expert editor.
      
      Original Text: "${text}"
      
      Instruction: ${instruction}
      ${context ? `Context: ${context}` : ""}
      
      Return ONLY the refined text. Do not add conversational filler.
    `,
  });

  return output;
}

export async function evaluateRequirement(
  req: z.infer<typeof RequirementSchema>,
  contextActors: { id: string; name: string }[]
) {
  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
    output: Output.object({
      schema: z.object({
        autoFix: z.string().optional(),
        issue: z.string().optional(),
        status: z.enum(["PASS", "FAIL"]),
        suggestion: z.string().optional(),
      }),
    }),
    prompt: `
      Act as a strict Product Manager Critic.
      
      Review this requirement:
      Title: "${req.title}"
      Description: "${req.description}"
      
      Context - Valid Actors: ${JSON.stringify(
        contextActors.map((a) => ({ id: a.id, name: a.name }))
      )}
      
      Rules:
      1. Must reference a specific Actor from the context.
      2. Must be testable.
      3. No corporate jargon.
      
      Return a PASS/FAIL result with a specific suggestion.
    `,
  });

  return output;
}
