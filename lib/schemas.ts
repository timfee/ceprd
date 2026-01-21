import { z } from "zod";

// Actors: The specific users/systems involved
export const ActorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["User", "Admin", "System", "Buyer", "Stakeholder"]),
  priority: z.enum(["Primary", "Secondary", "Tertiary"]),
  description: z.string().optional(),
});

// Glossary: Strictly defined terms to prevent ambiguity
export const TermSchema = z.object({
  id: z.string().uuid(),
  term: z.string().min(1),
  definition: z.string().min(10),
  bannedSynonyms: z.array(z.string()).default([]),
});

// Competitive Analysis (New)
export const CompetitorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  featureGaps: z.array(z.string()), // Things they have that we don't
  analysis: z.string().optional(), // AI-generated prose summary
});

// Functional Requirements
export const RequirementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5),
  description: z.string().min(20),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  status: z.enum(["Draft", "Proposed", "Approved", "Deprecated"]),
  primaryActorId: z.string().uuid(),
  secondaryActorIds: z.array(z.string().uuid()).default([]),
  type: z.enum(["User Story", "System Behavior", "Constraint", "Interface"]),
});

// Goals & Success Metrics
export const MetricSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  baseline: z.string().optional(),
  target: z.string(),
  type: z.enum(["Business", "UX", "Technical", "Security"]),
});

export const GoalSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["Critical", "High", "Medium"]),
  metrics: z.array(MetricSchema),
});

// Execution Strategy
export const MilestoneSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  targetDate: z.string().optional(),
  includedRequirementIds: z.array(z.string().uuid()),
  exitCriteria: z.array(z.string()),
});

// The Master Document
export const PRDSchema = z.object({
  meta: z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    lastUpdated: z.date(),
    version: z.number(),
    status: z.enum(["Draft", "Review", "Final"]),
  }),
  context: z.object({
    actors: z.array(ActorSchema),
    glossary: z.array(TermSchema),
    competitors: z.array(CompetitorSchema).default([]),
  }),
  sections: z.object({
    tldr: z.object({
      problem: z.string(),
      solution: z.string(),
      valueProps: z.array(z.string()),
    }),
    background: z.object({
      context: z.string(),
      marketDrivers: z.array(z.string()),
    }),
    goals: z.array(GoalSchema),
    requirements: z.array(RequirementSchema),
    milestones: z.array(MilestoneSchema),
  }),
});

export type PRD = z.infer<typeof PRDSchema>;
export type Actor = z.infer<typeof ActorSchema>;
export type Term = z.infer<typeof TermSchema>;
export type Competitor = z.infer<typeof CompetitorSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
