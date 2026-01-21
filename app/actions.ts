"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CONTEXT_CATEGORIES, PERSONA_ROLES } from "@/lib/repository";
import type { RequirementSchema } from "@/lib/schemas";

/**
 * Performs research on the competitive landscape.
 * Returns a structured list of competitors with SWOT analysis.
 */
export async function performCompetitiveResearch(productIdea: string) {
  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
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
    output: Output.object({
      schema: z.object({
        competitors: z.array(
          z.object({
            name: z.string(),
            url: z.string().optional(),
            strengths: z.array(z.string()),
            weaknesses: z.array(z.string()),
            featureGaps: z.array(z.string()),
            analysis: z.string(),
          })
        ),
      }),
    }),
  });

  return output.competitors;
}

/**
 * Generates content for specific PRD sections or sub-sections.
 */
export async function generateSectionContent(
  section: "tldr" | "background" | "tldr:problem" | "tldr:solution",
  context: { title: string; actors: { name: string; role: string }[] }
) {
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `
      Generate the content for the "${section}" section of a Product Requirements Document (PRD).
      
      Project Title: "${context.title}"
      Key Actors: ${context.actors.map((a) => `${a.name} (${a.role})`).join(", ")}
      
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
          ? `- ONLY generate the 'problem' field (2-3 sentences on core pain).`
          : ""
      }
      ${
        section === "tldr:solution"
          ? `- ONLY generate the 'solution' field (high-level approach).`
          : ""
      }
      ${
        section === "background"
          ? `- Return a JSON object with 'context' and 'marketDrivers'.`
          : ""
      }
    `,
    output: Output.object({
      schema: z.object({
        tldr: z
          .object({
            problem: z.string().optional(),
            solution: z.string().optional(),
          })
          .optional(),
        background: z
          .object({
            context: z.string(),
            marketDrivers: z.array(z.string()),
          })
          .optional(),
      }),
    }),
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
  console.log("🎯 generateIdeaDumpStructure started with idea:", idea);

  // Step 1: Start analysis
  progressCallback?.(0, "Analyzing product idea...");
  console.log("📖 Step 0: Starting analysis with chain-of-thought...");

  console.log(
    "🧠 Calling Gemini 2.0 Flash model with chain-of-thought prompting"
  );
  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
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
    
    For Suggested Terms:
    - Identify key technical acronyms (e.g. DLP, ZTNA, CEP) and specific product names.
    - Bias towards Google / Chrome Enterprise Premium terminology.

    For Background:
    - Provide initial Context and Market Drivers.
    - Consider these strategic contexts if relevant: ${CONTEXT_CATEGORIES.map((c) => c.label).join(", ")}.

    For Requirements:
    - Generate specific, testable functional requirements based on the idea.
    - CRITICAL: Assign a 'primaryActorName' to every requirement. It must match one of the 'name' fields in 'suggestedActors'.
    
    Return a valid JSON object matching the schema.
    `,
    output: Output.object({
      schema: z.object({
        title: z.string(),
        tldr: z.object({
          problem: z.string(),
          solution: z.string(),
          valueProps: z.array(z.string()),
        }),
        background: z.object({
          context: z.string(),
          marketDrivers: z.array(z.string()),
        }),
        suggestedActors: z.array(
          z.object({
            name: z.string(),
            role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
            priority: z.enum(["Primary", "Secondary", "Tertiary"]),
          })
        ),
        suggestedTerms: z.array(
          z.object({
            term: z.string(),
            definition: z.string(),
          })
        ),
        suggestedGoals: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            priority: z.enum(["Critical", "High", "Medium"]),
          })
        ),
        suggestedRequirements: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            priority: z.enum(["P0", "P1", "P2", "P3"]),
            type: z.enum([
              "User Story",
              "System Behavior",
              "Constraint",
              "Interface",
            ]),
            primaryActorName: z
              .string()
              .optional()
              .describe("Must match a name from suggestedActors"),
          })
        ),
        suggestedMilestones: z.array(
          z.object({
            title: z.string(),
            targetDate: z.string(),
          })
        ),
      }),
    }),
  });

  console.log("✅ Gemini response received");
  console.log("📊 Generated structure:", JSON.stringify(output, null, 2));

  // Step 2: Analysis complete, structure generated
  progressCallback?.(1, "Project structure defined");
  console.log("📖 Step 1: Project structure defined");

  // Step 3: Processing actors
  progressCallback?.(2, "Identifying key actors and personas");
  console.log("👥 Step 2: Processing actors...");
  console.log("🎭 Found", output.suggestedActors?.length || 0, "actors");

  // Step 4: Processing requirements
  progressCallback?.(3, "Generating functional requirements");
  console.log("📋 Step 3: Processing requirements...");
  console.log(
    "📝 Found",
    output.suggestedRequirements?.length || 0,
    "requirements"
  );

  // Step 5: Processing milestones
  progressCallback?.(4, "Creating project milestones");
  console.log("🎯 Step 4: Processing milestones...");
  console.log(
    "📅 Found",
    output.suggestedMilestones?.length || 0,
    "milestones"
  );

  // Step 6: Processing glossary
  progressCallback?.(5, "Setting up terminology glossary");
  console.log("📚 Step 5: Processing glossary...");
  console.log("📖 Found", output.suggestedTerms?.length || 0, "terms");

  // Complete
  progressCallback?.(6, "Draft generation completed!");
  console.log("🎉 Step 6: Draft generation completed!");

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
    prompt: `
      Analyze the following PRD content and identify 3-5 potential glossary terms that are missing from the current list.
      
      Current Glossary Terms: ${existingTerms.join(", ")}
      
      Content to Scan:
      "${content}"
      
      Guidelines:
      1. Focus on technical terms, acronyms (e.g., CEP, DLP, CEC), or product-specific concepts.
      2. Bias towards official Google / Chrome Enterprise Premium terminology.
      3. CRITICAL: Do NOT suggest generic words or headers like "User", "Admin", "TL;DR", "Background", "Requirements", "Goals", "Overview".
      4. Provide a concise definition for each term.
      
      Return a JSON array of terms.
    `,
    output: Output.object({
      schema: z.object({
        terms: z.array(
          z.object({
            term: z.string(),
            definition: z.string(),
          })
        ),
      }),
    }),
  });

  return output.terms;
}

/**
 * Evaluates a single requirement against the project context (Actors).
 * Returns a pass/fail status and critique.
 */
export async function evaluateRequirement(
  req: z.infer<typeof RequirementSchema>,
  contextActors: { id: string; name: string }[]
) {
  const { output } = await generateText({
    model: google("gemini-2.0-flash-001"),
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
    output: Output.object({
      schema: z.object({
        status: z.enum(["PASS", "FAIL"]),
        issue: z.string().optional(),
        suggestion: z.string().optional(),
        autoFix: z.string().optional(),
      }),
    }),
  });

  return output;
}
