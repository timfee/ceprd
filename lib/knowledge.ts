import { ACTOR_POLICY_DEFAULT, TERM_POLICY_DEFAULT } from "./policies";
import { type PRD } from "./schemas";

export const KNOWLEDGE_NODE_TYPES = [
  "actor",
  "competitor",
  "goal",
  "metric",
  "milestone",
  "narrative",
  "requirement",
  "term",
  "tldr",
] as const;

export const KNOWLEDGE_EDGE_TYPES = [
  "includesRequirement",
  "primaryActor",
  "relatedGoal",
  "secondaryActor",
  "successMetric",
  "termUsage",
] as const;

export const FOCUS_SECTIONS = [
  "actors",
  "background",
  "competitors",
  "copilot",
  "glossary",
  "goals",
  "milestones",
  "requirements",
  "tldr",
] as const;

export type KnowledgeNodeType = (typeof KNOWLEDGE_NODE_TYPES)[number];
export type KnowledgeEdgeType = (typeof KNOWLEDGE_EDGE_TYPES)[number];
export type FocusSection = (typeof FOCUS_SECTIONS)[number];

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  title: string;
  description?: string;
  sourceSection: FocusSection;
  tags?: string[];
}

export interface KnowledgeEdge {
  fromId: string;
  toId: string;
  type: KnowledgeEdgeType;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface FocusContext {
  section: FocusSection;
  nodeIds?: string[];
}

export interface ContextPack {
  meta: {
    discoveryMode: PRD["meta"]["discoveryMode"];
    status: PRD["meta"]["status"];
    title: PRD["meta"]["title"];
    version: PRD["meta"]["version"];
  };
  focus: FocusContext;
  policies: {
    actorPolicy: typeof ACTOR_POLICY_DEFAULT;
    termPolicy: typeof TERM_POLICY_DEFAULT;
  };
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

const DEFAULT_FOCUS: FocusContext = { section: "copilot" };
const MAX_FOCUS_NODES = 25;
const COPILOT_LIMITS = {
  actors: 5,
  competitors: 3,
  glossary: 5,
  goals: 5,
  milestones: 5,
  requirements: 8,
} as const;

function escapeRegex(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function buildTermRegex(term: string) {
  const trimmed = term.trim();
  if (!trimmed) {
    return null;
  }

  const escaped = escapeRegex(trimmed).replaceAll(/\s+/g, String.raw`\s+`);
  return new RegExp(`\\b${escaped}\\b`, "i");
}

function includesTerm(text: string, term: string) {
  const matcher = buildTermRegex(term);
  if (!matcher) {
    return false;
  }

  if (/[^a-zA-Z0-9\s]/.test(term)) {
    return text.toLowerCase().includes(term.toLowerCase());
  }

  return matcher.test(text);
}

function addActors(prd: PRD, nodes: KnowledgeNode[]) {
  for (const actor of prd.context.actors) {
    nodes.push({
      description: actor.description,
      id: actor.id,
      sourceSection: "actors",
      tags: [actor.role, actor.priority],
      title: actor.name,
      type: "actor",
    });
  }
}

function addCompetitors(prd: PRD, nodes: KnowledgeNode[]) {
  for (const competitor of prd.context.competitors) {
    nodes.push({
      description: competitor.analysis,
      id: competitor.id,
      sourceSection: "competitors",
      tags: competitor.selected ? ["selected"] : undefined,
      title: competitor.name,
      type: "competitor",
    });
  }
}

function addTerms(prd: PRD, nodes: KnowledgeNode[]) {
  for (const term of prd.context.glossary) {
    nodes.push({
      description: term.definition,
      id: term.id,
      sourceSection: "glossary",
      title: term.term,
      type: "term",
    });
  }
}

function addGoals(prd: PRD, nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  for (const goal of prd.sections.goals) {
    nodes.push({
      description: goal.description,
      id: goal.id,
      sourceSection: "goals",
      tags: [goal.priority],
      title: goal.title,
      type: "goal",
    });

    for (const metric of goal.metrics) {
      nodes.push({
        description: metric.description,
        id: metric.id,
        sourceSection: "goals",
        tags: [metric.type],
        title: metric.description,
        type: "metric",
      });
      edges.push({
        fromId: goal.id,
        toId: metric.id,
        type: "successMetric",
      });
    }
  }
}

function addRequirements(
  prd: PRD,
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[]
) {
  for (const requirement of prd.sections.requirements) {
    nodes.push({
      description: requirement.description,
      id: requirement.id,
      sourceSection: "requirements",
      tags: [requirement.priority, requirement.type, requirement.status],
      title: requirement.title,
      type: "requirement",
    });

    if (requirement.primaryActorId) {
      edges.push({
        fromId: requirement.id,
        toId: requirement.primaryActorId,
        type: "primaryActor",
      });
    }

    for (const actorId of requirement.secondaryActorIds) {
      edges.push({
        fromId: requirement.id,
        toId: actorId,
        type: "secondaryActor",
      });
    }

    for (const goalId of requirement.relatedGoalIds) {
      edges.push({
        fromId: requirement.id,
        toId: goalId,
        type: "relatedGoal",
      });
    }
  }
}

function addMilestones(
  prd: PRD,
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[]
) {
  for (const milestone of prd.sections.milestones) {
    nodes.push({
      description: milestone.exitCriteria.join("\n"),
      id: milestone.id,
      sourceSection: "milestones",
      title: milestone.title,
      type: "milestone",
    });

    for (const requirementId of milestone.includedRequirementIds) {
      edges.push({
        fromId: milestone.id,
        toId: requirementId,
        type: "includesRequirement",
      });
    }
  }
}

function addBackground(prd: PRD, nodes: KnowledgeNode[]) {
  for (const block of prd.sections.background.blocks) {
    nodes.push({
      description: block.content,
      id: block.id,
      sourceSection: "background",
      tags: [block.type],
      title: block.title,
      type: "narrative",
    });
  }
}

function addTldr(prd: PRD, nodes: KnowledgeNode[]) {
  nodes.push({
    description: prd.sections.tldr.problem,
    id: `${prd.meta.id}-problem`,
    sourceSection: "tldr",
    title: "Problem",
    type: "tldr",
  });
  nodes.push({
    description: prd.sections.tldr.solution,
    id: `${prd.meta.id}-solution`,
    sourceSection: "tldr",
    title: "Solution",
    type: "tldr",
  });
}

function addTermUsageEdges(prd: PRD, edges: KnowledgeEdge[]) {
  for (const term of prd.context.glossary) {
    for (const requirement of prd.sections.requirements) {
      if (
        includesTerm(requirement.title, term.term) ||
        includesTerm(requirement.description, term.term)
      ) {
        edges.push({
          fromId: term.id,
          toId: requirement.id,
          type: "termUsage",
        });
      }
    }
    for (const goal of prd.sections.goals) {
      if (
        includesTerm(goal.title, term.term) ||
        includesTerm(goal.description, term.term)
      ) {
        edges.push({
          fromId: term.id,
          toId: goal.id,
          type: "termUsage",
        });
      }
    }
  }
}

export function buildKnowledgeGraph(prd: PRD): KnowledgeGraph {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];

  addActors(prd, nodes);
  addCompetitors(prd, nodes);
  addTerms(prd, nodes);
  addGoals(prd, nodes, edges);
  addRequirements(prd, nodes, edges);
  addMilestones(prd, nodes, edges);
  addBackground(prd, nodes);
  addTldr(prd, nodes);
  addTermUsageEdges(prd, edges);

  return { edges, nodes };
}

function selectContextGraph(
  graph: KnowledgeGraph,
  focus: FocusContext
): KnowledgeGraph {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const selectedIds = new Set<string>();

  if (focus.nodeIds && focus.nodeIds.length > 0) {
    for (const id of focus.nodeIds) {
      if (nodesById.has(id)) {
        selectedIds.add(id);
      }
    }
  } else if (focus.section === "copilot") {
    const bySection = new Map<FocusSection, KnowledgeNode[]>();
    for (const node of graph.nodes) {
      const list = bySection.get(node.sourceSection) ?? [];
      list.push(node);
      bySection.set(node.sourceSection, list);
    }

    const sectionLimits: [FocusSection, number][] = [
      ["actors", COPILOT_LIMITS.actors],
      ["competitors", COPILOT_LIMITS.competitors],
      ["glossary", COPILOT_LIMITS.glossary],
      ["goals", COPILOT_LIMITS.goals],
      ["milestones", COPILOT_LIMITS.milestones],
      ["requirements", COPILOT_LIMITS.requirements],
    ];

    for (const [section, limit] of sectionLimits) {
      const items = bySection.get(section) ?? [];
      for (const node of items.slice(0, limit)) {
        selectedIds.add(node.id);
      }
    }
  } else {
    const sectionNodes = graph.nodes.filter(
      (node) => node.sourceSection === focus.section
    );
    for (const node of sectionNodes.slice(0, MAX_FOCUS_NODES)) {
      selectedIds.add(node.id);
    }
  }

  for (const node of graph.nodes) {
    if (node.type === "tldr") {
      selectedIds.add(node.id);
    }
  }

  for (const edge of graph.edges) {
    if (selectedIds.has(edge.fromId) || selectedIds.has(edge.toId)) {
      selectedIds.add(edge.fromId);
      selectedIds.add(edge.toId);
    }
  }

  const nodes = graph.nodes.filter((node) => selectedIds.has(node.id));
  const edges = graph.edges.filter(
    (edge) => selectedIds.has(edge.fromId) && selectedIds.has(edge.toId)
  );

  return { edges, nodes };
}

export function buildContextPack(prd: PRD, focus?: FocusContext): ContextPack {
  const graph = buildKnowledgeGraph(prd);
  const resolvedFocus = focus ?? DEFAULT_FOCUS;
  const contextGraph = selectContextGraph(graph, resolvedFocus);

  return {
    edges: contextGraph.edges,
    focus: resolvedFocus,
    meta: {
      discoveryMode: prd.meta.discoveryMode,
      status: prd.meta.status,
      title: prd.meta.title,
      version: prd.meta.version,
    },
    nodes: contextGraph.nodes,
    policies: {
      actorPolicy: ACTOR_POLICY_DEFAULT,
      termPolicy: TERM_POLICY_DEFAULT,
    },
  };
}
