import { type UIMessage, convertToModelMessages, streamText, tool } from "ai";
import { z } from "zod";

import { generateIdeaDumpStructure } from "@/app/actions";
import { AIResponseSchema } from "@/lib/ai-contract";
import { type ContextPack } from "@/lib/knowledge";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("Chat API called");

  const { contextPack, messages } = (await req.json()) as {
    contextPack?: ContextPack;
    messages: unknown[];
  };
  console.log("Messages received:", JSON.stringify(messages, null, 2));

  console.log("Starting streamText with Gemini model");
  const contextBlock = contextPack
    ? `\n\n## PRD Context Pack\n${JSON.stringify(contextPack, null, 2)}`
    : "";

  const result = streamText({
    messages: await convertToModelMessages(messages as UIMessage[]),
    model: "google/gemini-2.0-flash-001",
    system: `${SYSTEM_PROMPT}${contextBlock}`,
    tools: {
      addActor: tool({
        description: "Add a new actor/persona to the PRD.",
        execute: async (args) => await Promise.resolve(args),
        inputSchema: z.object({
          description: z.string().optional(),
          name: z.string(),
          priority: z.enum(["Primary", "Secondary", "Tertiary"]),
          role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
        }),
      }),
      addGoal: tool({
        description: "Add a new project goal.",
        execute: async (args) => await Promise.resolve(args),
        inputSchema: z.object({
          description: z.string(),
          priority: z.enum(["Critical", "High", "Medium"]),
          title: z.string(),
        }),
      }),
      addRequirement: tool({
        description: "Add a new functional requirement.",
        execute: async (args) => await Promise.resolve(args),
        inputSchema: z.object({
          description: z.string(),
          priority: z.enum(["P0", "P1", "P2", "P3"]),
          title: z.string(),
          type: z.enum([
            "User Story",
            "System Behavior",
            "Constraint",
            "Interface",
          ]),
        }),
      }),
      generateDraft: tool({
        description:
          "Initialize a NEW Product Requirements Document (PRD) from a description. Use this whenever the user asks to 'write', 'create', 'start', or 'generate' a PRD for a specific product idea, regardless of what the product does (e.g., 'a chat bot', 'an email system', 'an admin tool').",
        execute: async ({ idea }: { idea: string }) => {
          console.log("generateDraft tool called with idea:", idea);
          console.log("Starting generateIdeaDumpStructure...");

          try {
            const structure = await generateIdeaDumpStructure(idea);
            console.log("generateIdeaDumpStructure completed successfully");
            console.log("Generated structure keys:", Object.keys(structure));
            return structure;
          } catch (error) {
            console.error("generateIdeaDumpStructure failed:", error);
            throw error;
          }
        },
        inputSchema: z.object({
          idea: z
            .string()
            .describe(
              "The full description of the product idea provided by the user."
            ),
        }),
      }),
      proposeChanges: tool({
        description: "Propose a batch of PRD changes with traceable citations.",
        execute: async (args) => await Promise.resolve(args),
        inputSchema: AIResponseSchema,
      }),
      updateTLDR: tool({
        description: "Update the TL;DR problem or solution.",
        execute: async (args) => await Promise.resolve(args),
        inputSchema: z.object({
          problem: z.string().optional(),
          solution: z.string().optional(),
        }),
      }),
    },
  });

  console.log("Returning stream response");
  return result.toUIMessageStreamResponse();
}
