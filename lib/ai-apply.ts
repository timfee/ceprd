import { z } from "zod";

import { ACTOR_POLICY_DEFAULT, TERM_POLICY_DEFAULT } from "./policies";
import { type PRDState } from "./store";
import { AIResponseSchema, type AIChange } from "./ai-contract";
import { type PRD } from "./schemas";

const ACTOR_ROLES = [
  "User",
  "Admin",
  "System",
  "Buyer",
  "Stakeholder",
] as const;
const ACTOR_PRIORITIES = ["Primary", "Secondary", "Tertiary"] as const;
const GOAL_PRIORITIES = ["Critical", "High", "Medium"] as const;
const METRIC_TYPES = ["Business", "UX", "Technical", "Security"] as const;
const REQUIREMENT_PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
const REQUIREMENT_TYPES = [
  "User Story",
  "System Behavior",
  "Constraint",
  "Interface",
] as const;
const REQUIREMENT_STATUSES = [
  "Draft",
  "Proposed",
  "Approved",
  "Deprecated",
] as const;

const actorDataSchema = z.object({
  priority: z.enum(ACTOR_PRIORITIES).optional(),
  role: z.enum(ACTOR_ROLES).optional(),
});

const goalDataSchema = z.object({
  priority: z.enum(GOAL_PRIORITIES).optional(),
});

const requirementDataSchema = z.object({
  primaryActorId: z.string().optional(),
  priority: z.enum(REQUIREMENT_PRIORITIES).optional(),
  relatedGoalIds: z.array(z.string()).optional(),
  secondaryActorIds: z.array(z.string()).optional(),
  status: z.enum(REQUIREMENT_STATUSES).optional(),
  type: z.enum(REQUIREMENT_TYPES).optional(),
});

const metricDataSchema = z.object({
  baseline: z.string().optional(),
  goalId: z.string(),
  target: z.string(),
  type: z.enum(METRIC_TYPES),
});

const termDataSchema = z.object({
  bannedSynonyms: z.array(z.string()).optional(),
});

const competitorDataSchema = z.object({
  analysis: z.string().optional(),
  featureGaps: z.array(z.string()).optional(),
  selected: z.boolean().optional(),
  strengths: z.array(z.string()).optional(),
  url: z.string().optional(),
  weaknesses: z.array(z.string()).optional(),
});

const milestoneDataSchema = z.object({
  exitCriteria: z.array(z.string()).optional(),
  includedRequirementIds: z.array(z.string()).optional(),
  targetDate: z.string().optional(),
});

function addUnique(items: string[], value: string) {
  return items.includes(value) ? items : [...items, value];
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function isBlockedValue(value: string, blocklist: string[]) {
  const normalized = normalizeValue(value);
  return blocklist.some((entry) => normalizeValue(entry) === normalized);
}

export interface ApplyResult {
  applied: number;
  errors: string[];
}

export function validateAiResponse(input: unknown) {
  const parsed = AIResponseSchema.safeParse(input);
  if (parsed.success) {
    return { errors: [], response: parsed.data };
  }

  return {
    errors: parsed.error.issues.map((error) => error.message),
    response: undefined,
  };
}

function findMetricGoalId(prd: PRD, metricId: string) {
  for (const goal of prd.sections.goals) {
    if (goal.metrics.some((metric) => metric.id === metricId)) {
      return goal.id;
    }
  }
  return null;
}

function resolveNodeType(prd: PRD, id: string) {
  if (prd.context.actors.some((item) => item.id === id)) {
    return "actor" as const;
  }
  if (prd.context.glossary.some((item) => item.id === id)) {
    return "term" as const;
  }
  if (prd.context.competitors.some((item) => item.id === id)) {
    return "competitor" as const;
  }
  if (prd.sections.goals.some((item) => item.id === id)) {
    return "goal" as const;
  }
  if (prd.sections.milestones.some((item) => item.id === id)) {
    return "milestone" as const;
  }
  if (prd.sections.requirements.some((item) => item.id === id)) {
    return "requirement" as const;
  }
  if (findMetricGoalId(prd, id)) {
    return "metric" as const;
  }
  return null;
}

function applyAddActor(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"]
) {
  if (isBlockedValue(node.title, ACTOR_POLICY_DEFAULT.blocklist)) {
    return `Actor name "${node.title}" is blocked by policy.`;
  }

  const data = actorDataSchema.safeParse(node.data ?? {});
  const role = data.success ? (data.data.role ?? "User") : "User";
  const priority = data.success
    ? (data.data.priority ?? "Secondary")
    : "Secondary";

  actions.addActor({
    description: node.description,
    name: node.title,
    priority,
    role,
  });
  return null;
}

function applyAddTerm(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"]
) {
  if (isBlockedValue(node.title, TERM_POLICY_DEFAULT.blocklist)) {
    return `Glossary term "${node.title}" is blocked by policy.`;
  }

  const data = termDataSchema.safeParse(node.data ?? {});
  actions.addTerm({
    bannedSynonyms: data.success ? (data.data.bannedSynonyms ?? []) : [],
    definition: node.description ?? "",
    term: node.title,
  });
  return null;
}

function applyAddGoal(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"]
) {
  const data = goalDataSchema.safeParse(node.data ?? {});
  const priority = data.success ? (data.data.priority ?? "Medium") : "Medium";
  actions.addGoal({
    description: node.description ?? "",
    metrics: [],
    priority,
    title: node.title,
  });
  return null;
}

function applyAddMetric(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"],
  prd: PRD
) {
  const data = metricDataSchema.safeParse(node.data ?? {});
  if (!data.success) {
    return "Metric data is incomplete; expected goalId, target, and type.";
  }

  const goal = prd.sections.goals.find((item) => item.id === data.data.goalId);
  if (!goal) {
    return `Goal ${data.data.goalId} not found for metric.`;
  }

  const nextMetrics = [
    ...goal.metrics,
    {
      baseline: data.data.baseline,
      description: node.title,
      id: node.id,
      target: data.data.target,
      type: data.data.type,
    },
  ];

  actions.updateGoal(goal.id, { metrics: nextMetrics });
  return null;
}

function applyAddRequirement(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"]
) {
  const data = requirementDataSchema.safeParse(node.data ?? {});
  const payload = data.success ? data.data : {};
  actions.addRequirement({
    description: node.description ?? "",
    primaryActorId: payload.primaryActorId ?? "",
    priority: payload.priority ?? "P2",
    relatedGoalIds: payload.relatedGoalIds ?? [],
    secondaryActorIds: payload.secondaryActorIds ?? [],
    status: payload.status ?? "Draft",
    title: node.title,
    type: payload.type ?? "User Story",
  });
  return null;
}

function applyAddMilestone(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"]
) {
  const data = milestoneDataSchema.safeParse(node.data ?? {});
  const payload = data.success ? data.data : {};
  actions.addMilestone({
    exitCriteria: payload.exitCriteria ?? [],
    includedRequirementIds: payload.includedRequirementIds ?? [],
    targetDate: payload.targetDate,
    title: node.title,
  });
  return null;
}

function applyAddCompetitor(
  node: Required<AIChange>["node"],
  actions: PRDState["actions"],
  prd: PRD
) {
  const data = competitorDataSchema.safeParse(node.data ?? {});
  const payload = data.success ? data.data : {};
  const next = {
    analysis: payload.analysis,
    featureGaps: payload.featureGaps ?? [],
    id: node.id,
    name: node.title,
    selected: payload.selected ?? false,
    strengths: payload.strengths ?? [],
    url: payload.url,
    weaknesses: payload.weaknesses ?? [],
  };

  actions.setCompetitors([...prd.context.competitors, next]);
  return null;
}

function applyAddChange(
  change: AIChange,
  actions: PRDState["actions"],
  prd: PRD
): string | null {
  const { node } = change;
  if (!node) {
    return "Missing node payload for add operation.";
  }

  if (prd.meta.discoveryMode === "off") {
    return "Discovery mode is off; skipping add operation.";
  }

  if (node.type === "actor") {
    return applyAddActor(node, actions);
  }

  if (node.type === "term") {
    return applyAddTerm(node, actions);
  }

  if (node.type === "goal") {
    return applyAddGoal(node, actions);
  }

  if (node.type === "metric") {
    return applyAddMetric(node, actions, prd);
  }

  if (node.type === "requirement") {
    return applyAddRequirement(node, actions);
  }

  if (node.type === "milestone") {
    return applyAddMilestone(node, actions);
  }

  if (node.type === "competitor") {
    return applyAddCompetitor(node, actions, prd);
  }

  return `Unsupported node type "${node.type}" for add operation.`;
}

function applyUpdateActor(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"]
) {
  actions.updateActor(nodeId, {
    description: patch.description,
    name: patch.title,
  });
  return null;
}

function applyUpdateTerm(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"]
) {
  actions.updateTerm(nodeId, {
    definition: patch.description,
    term: patch.title,
  });
  return null;
}

function applyUpdateGoal(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"]
) {
  const data = goalDataSchema.safeParse(patch.data ?? {});
  actions.updateGoal(nodeId, {
    description: patch.description,
    priority: data.success ? data.data.priority : undefined,
    title: patch.title,
  });
  return null;
}

function applyUpdateMetric(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"],
  prd: PRD
) {
  const data = metricDataSchema.safeParse(patch.data ?? {});
  if (!data.success) {
    return "Metric update missing goalId, target, or type.";
  }
  const goal = prd.sections.goals.find((item) => item.id === data.data.goalId);
  if (!goal) {
    return `Goal ${data.data.goalId} not found for metric update.`;
  }
  const nextMetrics = goal.metrics.map((metric) =>
    metric.id === nodeId
      ? {
          ...metric,
          baseline: data.data.baseline ?? metric.baseline,
          description: patch.title ?? metric.description,
          target: data.data.target ?? metric.target,
          type: data.data.type ?? metric.type,
        }
      : metric
  );
  actions.updateGoal(goal.id, { metrics: nextMetrics });
  return null;
}

function applyUpdateRequirement(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"]
) {
  const data = requirementDataSchema.safeParse(patch.data ?? {});
  const payload = data.success ? data.data : {};
  actions.updateRequirement(nodeId, {
    description: patch.description,
    primaryActorId: payload.primaryActorId,
    priority: payload.priority,
    relatedGoalIds: payload.relatedGoalIds,
    secondaryActorIds: payload.secondaryActorIds,
    status: payload.status,
    title: patch.title,
    type: payload.type,
  });
  return null;
}

function applyUpdateMilestone(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"]
) {
  const data = milestoneDataSchema.safeParse(patch.data ?? {});
  const payload = data.success ? data.data : {};
  actions.updateMilestone(nodeId, {
    exitCriteria: payload.exitCriteria,
    includedRequirementIds: payload.includedRequirementIds,
    targetDate: payload.targetDate,
    title: patch.title,
  });
  return null;
}

function applyUpdateCompetitor(
  nodeId: string,
  patch: Required<AIChange>["patch"],
  actions: PRDState["actions"],
  prd: PRD
) {
  const data = competitorDataSchema.safeParse(patch.data ?? {});
  const payload = data.success ? data.data : {};
  const updated = prd.context.competitors.map((competitor) =>
    competitor.id === nodeId
      ? {
          ...competitor,
          analysis: payload.analysis ?? competitor.analysis,
          featureGaps: payload.featureGaps ?? competitor.featureGaps,
          name: patch.title ?? competitor.name,
          selected: payload.selected ?? competitor.selected,
          strengths: payload.strengths ?? competitor.strengths,
          url: payload.url ?? competitor.url,
          weaknesses: payload.weaknesses ?? competitor.weaknesses,
        }
      : competitor
  );
  actions.setCompetitors(updated);
  return null;
}

function applyUpdateChange(
  change: AIChange,
  actions: PRDState["actions"],
  prd: PRD
): string | null {
  const { nodeId, patch } = change;
  if (!nodeId || !patch) {
    return "Missing nodeId or patch for update operation.";
  }

  const nodeType = resolveNodeType(prd, nodeId);
  if (!nodeType) {
    return `Could not resolve node type for ${nodeId}.`;
  }

  if (nodeType === "actor") {
    return applyUpdateActor(nodeId, patch, actions);
  }

  if (nodeType === "term") {
    return applyUpdateTerm(nodeId, patch, actions);
  }

  if (nodeType === "goal") {
    return applyUpdateGoal(nodeId, patch, actions);
  }

  if (nodeType === "metric") {
    return applyUpdateMetric(nodeId, patch, actions, prd);
  }

  if (nodeType === "requirement") {
    return applyUpdateRequirement(nodeId, patch, actions);
  }

  if (nodeType === "milestone") {
    return applyUpdateMilestone(nodeId, patch, actions);
  }

  if (nodeType === "competitor") {
    return applyUpdateCompetitor(nodeId, patch, actions, prd);
  }

  return `Unsupported node type "${nodeType}" for update operation.`;
}

function applyLinkChange(
  change: AIChange,
  actions: PRDState["actions"],
  prd: PRD
): string | null {
  const { edgeType, fromId, toId } = change;
  if (!edgeType || !fromId || !toId) {
    return "Missing edge data for link operation.";
  }

  if (edgeType === "relatedGoal") {
    const requirement = prd.sections.requirements.find(
      (item) => item.id === fromId
    );
    if (!requirement) {
      return `Requirement ${fromId} not found.`;
    }

    const updated = addUnique(requirement.relatedGoalIds, toId);
    actions.updateRequirement(fromId, { relatedGoalIds: updated });
    return null;
  }

  if (edgeType === "primaryActor") {
    actions.updateRequirement(fromId, { primaryActorId: toId });
    return null;
  }

  if (edgeType === "secondaryActor") {
    const requirement = prd.sections.requirements.find(
      (item) => item.id === fromId
    );
    if (!requirement) {
      return `Requirement ${fromId} not found.`;
    }
    const updated = addUnique(requirement.secondaryActorIds, toId);
    actions.updateRequirement(fromId, { secondaryActorIds: updated });
    return null;
  }

  if (edgeType === "includesRequirement") {
    const milestone = prd.sections.milestones.find(
      (item) => item.id === fromId
    );
    if (!milestone) {
      return `Milestone ${fromId} not found.`;
    }
    const updated = addUnique(milestone.includedRequirementIds, toId);
    actions.updateMilestone(fromId, { includedRequirementIds: updated });
    return null;
  }

  if (edgeType === "successMetric") {
    const goal = prd.sections.goals.find((item) => item.id === fromId);
    if (!goal) {
      return `Goal ${fromId} not found.`;
    }
    const metric = prd.sections.goals
      .flatMap((item) => item.metrics)
      .find((item) => item.id === toId);
    if (!metric) {
      return "Metric not found for successMetric link.";
    }
    const exists = goal.metrics.some((item) => item.id === toId);
    if (exists) {
      return null;
    }
    actions.updateGoal(goal.id, { metrics: [...goal.metrics, metric] });
    return null;
  }

  return `Unsupported edge type "${edgeType}" for link operation.`;
}

export function applyAiResponse(
  input: unknown,
  actions: PRDState["actions"],
  prd: PRD
): ApplyResult {
  const { errors, response } = validateAiResponse(input);
  if (!response) {
    return { applied: 0, errors };
  }

  const applyErrors: string[] = [];
  let applied = 0;

  for (const change of response.changes) {
    let error: string | null = null;
    if (change.op === "add") {
      error = applyAddChange(change, actions, prd);
    } else if (change.op === "update") {
      error = applyUpdateChange(change, actions, prd);
    } else if (change.op === "link") {
      error = applyLinkChange(change, actions, prd);
    }

    if (error) {
      applyErrors.push(error);
    } else {
      applied += 1;
    }
  }

  return { applied, errors: applyErrors };
}
