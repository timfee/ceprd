import { z } from "zod";

// Draft Structure Schema (Used by generateIdeaDumpStructure)
export const SuggestedActorSchema = z.object({
  name: z.string(),
  priority: z.enum(["Primary", "Secondary", "Tertiary"]),
  role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
});

export const SuggestedTermSchema = z.object({
  definition: z.string(),
  term: z.string(),
});

export const SuggestedGoalSchema = z.object({
  description: z.string(),
  priority: z.enum(["Critical", "High", "Medium"]),
  title: z.string(),
});

export const SuggestedRequirementSchema = z.object({
  description: z.string(),
  primaryActorName: z
    .string()
    .optional()
    .describe("Must match a name from suggestedActors"),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  title: z.string(),
  type: z.enum(["User Story", "System Behavior", "Constraint", "Interface"]),
});

export const SuggestedMilestoneSchema = z.object({
  targetDate: z.string(),
  title: z.string(),
});

export const DraftStructureSchema = z.object({
  background: z.object({
    context: z.string(),
    marketDrivers: z.array(z.string()),
  }),
  suggestedActors: z.array(SuggestedActorSchema),
  suggestedGoals: z.array(SuggestedGoalSchema),
  suggestedMilestones: z.array(SuggestedMilestoneSchema),
  suggestedRequirements: z.array(SuggestedRequirementSchema),
  suggestedTerms: z.array(SuggestedTermSchema),
  title: z.string(),
  tldr: z.object({
    problem: z.string(),
    solution: z.string(),
    valueProps: z.array(z.string()),
  }),
});

export type DraftStructure = z.infer<typeof DraftStructureSchema>;

// Competitive Research Result Schema
export const CompetitiveAnalysisSchema = z.object({
  analysis: z.string(),
  featureGaps: z.array(z.string()),
  name: z.string(),
  strengths: z.array(z.string()),
  url: z.string().optional(),
  weaknesses: z.array(z.string()),
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
