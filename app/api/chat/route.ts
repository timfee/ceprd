import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, tool } from "ai";
import { z } from "zod";
import { generateIdeaDumpStructure } from "@/app/actions";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("🚀 Chat API called");

  const { messages } = await req.json();
  console.log("📝 Messages received:", JSON.stringify(messages, null, 2));

  console.log("🤖 Starting streamText with Gemini model");
  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools: {
      generateDraft: tool({
        description:
          "Initialize a NEW Product Requirements Document (PRD) from a description. Use this whenever the user asks to 'write', 'create', 'start', or 'generate' a PRD for a specific product idea, regardless of what the product does (e.g., 'a chat bot', 'an email system', 'an admin tool').",
        inputSchema: z.object({
          idea: z
            .string()
            .describe(
              "The full description of the product idea provided by the user."
            ),
        }),
        execute: async ({ idea }: { idea: string }) => {
          console.log("🛠️ generateDraft tool called with idea:", idea);
          console.log("📊 Starting generateIdeaDumpStructure...");

          try {
            const structure = await generateIdeaDumpStructure(idea);
            console.log("✅ generateIdeaDumpStructure completed successfully");
            console.log("📋 Generated structure keys:", Object.keys(structure));
            return structure;
          } catch (error) {
            console.error("❌ generateIdeaDumpStructure failed:", error);
            throw error;
          }
        },
      }),
      addActor: tool({
        description: "Add a new actor/persona to the PRD.",
        inputSchema: z.object({
          name: z.string(),
          role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
          priority: z.enum(["Primary", "Secondary", "Tertiary"]),
          description: z.string().optional(),
        }),
        execute: async (args) => {
          return await Promise.resolve(args);
        },
      }),
      addRequirement: tool({
        description: "Add a new functional requirement.",
        inputSchema: z.object({
          title: z.string(),
          description: z.string(),
          priority: z.enum(["P0", "P1", "P2", "P3"]),
          type: z.enum([
            "User Story",
            "System Behavior",
            "Constraint",
            "Interface",
          ]),
        }),
        execute: async (args) => {
          return await Promise.resolve(args);
        },
      }),
      addGoal: tool({
        description: "Add a new project goal.",
        inputSchema: z.object({
          title: z.string(),
          description: z.string(),
          priority: z.enum(["Critical", "High", "Medium"]),
        }),
        execute: async (args) => {
          return await Promise.resolve(args);
        },
      }),
      updateTLDR: tool({
        description: "Update the TL;DR problem or solution.",
        inputSchema: z.object({
          problem: z.string().optional(),
          solution: z.string().optional(),
        }),
        execute: async (args) => {
          return await Promise.resolve(args);
        },
      }),
    },
  });

  console.log("📡 Returning stream response");
  return result.toUIMessageStreamResponse();
}
