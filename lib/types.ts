import { z } from "zod";

// Draft Structure Schema (Used by generateIdeaDumpStructure)
export const SuggestedActorSchema = z.object({
  name: z.string(),
  role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
  priority: z.enum(["Primary", "Secondary", "Tertiary"]),
});

export const SuggestedTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const SuggestedGoalSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["Critical", "High", "Medium"]),
});

export const SuggestedRequirementSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  type: z.enum(["User Story", "System Behavior", "Constraint", "Interface"]),
  primaryActorName: z
    .string()
    .optional()
    .describe("Must match a name from suggestedActors"),
});

export const SuggestedMilestoneSchema = z.object({
  title: z.string(),
  targetDate: z.string(),
});

export const DraftStructureSchema = z.object({
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
  suggestedActors: z.array(SuggestedActorSchema),
  suggestedTerms: z.array(SuggestedTermSchema),
  suggestedGoals: z.array(SuggestedGoalSchema),
  suggestedRequirements: z.array(SuggestedRequirementSchema),
  suggestedMilestones: z.array(SuggestedMilestoneSchema),
});

export type DraftStructure = z.infer<typeof DraftStructureSchema>;

// Competitive Research Result Schema
export const CompetitiveAnalysisSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  featureGaps: z.array(z.string()),
  analysis: z.string(),
});

export type CompetitiveAnalysisResult = z.infer<
  typeof CompetitiveAnalysisSchema
>;

export interface ProposedChange {
  title?: string;
  description?: string;
  problem?: string;
  solution?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}
