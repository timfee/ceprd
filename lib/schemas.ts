import { z } from "zod";

// Actors: The specific users/systems involved
export const ActorSchema = z.object({
  description: z.string().optional(),
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  priority: z.enum(["Primary", "Secondary", "Tertiary"]),
  role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
});

// Glossary: Strictly defined terms to prevent ambiguity
export const TermSchema = z.object({
  bannedSynonyms: z.array(z.string()).default([]),
  definition: z.string().min(10),
  id: z.string().uuid(),
  term: z.string().min(1),
});

// Competitive Analysis (New)
export const CompetitorSchema = z.object({
  // AI-generated prose summary
  analysis: z.string().optional(),
  // Things they have that we don't
  featureGaps: z.array(z.string()),
  id: z.string().uuid(),
  name: z.string(),
  selected: z.boolean().default(false),
  strengths: z.array(z.string()),
  url: z.string().url().optional(),
  weaknesses: z.array(z.string()),
});

// Functional Requirements
export const RequirementSchema = z.object({
  description: z.string().min(20),
  id: z.string().uuid(),
  primaryActorId: z.string().uuid(),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  secondaryActorIds: z.array(z.string().uuid()).default([]),
  status: z.enum(["Draft", "Proposed", "Approved", "Deprecated"]),
  title: z.string().min(5),
  type: z.enum(["User Story", "System Behavior", "Constraint", "Interface"]),
});

// Goals & Success Metrics
export const MetricSchema = z.object({
  baseline: z.string().optional(),
  description: z.string(),
  id: z.string().uuid(),
  target: z.string(),
  type: z.enum(["Business", "UX", "Technical", "Security"]),
});

export const GoalSchema = z.object({
  description: z.string(),
  id: z.string().uuid(),
  metrics: z.array(MetricSchema),
  priority: z.enum(["Critical", "High", "Medium"]),
  title: z.string(),
});

// Execution Strategy
export const MilestoneSchema = z.object({
  exitCriteria: z.array(z.string()),
  id: z.string().uuid(),
  includedRequirementIds: z.array(z.string().uuid()),
  targetDate: z.string().optional(),
  title: z.string(),
});

export const NarrativeBlockSchema = z.object({
  content: z.string(),
  id: z.string().uuid(),
  title: z.string(),
  type: z.enum(["text", "driver"]),
});

// The Master Document
export const PRDSchema = z.object({
  context: z.object({
    actors: z.array(ActorSchema),
    competitors: z.array(CompetitorSchema).default([]),
    glossary: z.array(TermSchema),
  }),
  meta: z.object({
    id: z.string().uuid(),
    lastUpdated: z.date(),
    status: z.enum(["Draft", "Review", "Final"]),
    title: z.string().min(1),
    version: z.number(),
  }),
  sections: z.object({
    background: z.object({
      blocks: z.array(NarrativeBlockSchema).default([]),
      context: z.string(),
      marketDrivers: z.array(z.string()),
    }),
    goals: z.array(GoalSchema),
    milestones: z.array(MilestoneSchema),
    requirements: z.array(RequirementSchema),
    tldr: z.object({
      problem: z.string(),
      solution: z.string(),
      valueProps: z.array(z.string()),
    }),
  }),
});

export type PRD = z.infer<typeof PRDSchema>;
export type Actor = z.infer<typeof ActorSchema>;
export type Term = z.infer<typeof TermSchema>;
export type Competitor = z.infer<typeof CompetitorSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type NarrativeBlock = z.infer<typeof NarrativeBlockSchema>;
