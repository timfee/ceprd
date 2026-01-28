import { type PRD } from "./schemas";

export type FocusKind =
  | "actor"
  | "competitor"
  | "goal"
  | "milestone"
  | "requirement"
  | "term"
  | "mixed";

export interface FocusMeta {
  count: number;
  kind: FocusKind;
  label: string;
}

function resolveFocusLabel(prd: PRD, id: string) {
  const actor = prd.context.actors.find((item) => item.id === id);
  if (actor) {
    return { kind: "actor" as const, label: `Actor: ${actor.name}` };
  }

  const term = prd.context.glossary.find((item) => item.id === id);
  if (term) {
    return { kind: "term" as const, label: `Term: ${term.term}` };
  }

  const competitor = prd.context.competitors.find((item) => item.id === id);
  if (competitor) {
    return {
      kind: "competitor" as const,
      label: `Competitor: ${competitor.name}`,
    };
  }

  const goal = prd.sections.goals.find((item) => item.id === id);
  if (goal) {
    return { kind: "goal" as const, label: `Goal: ${goal.title}` };
  }

  const requirement = prd.sections.requirements.find((item) => item.id === id);
  if (requirement) {
    return {
      kind: "requirement" as const,
      label: `Requirement: ${requirement.title}`,
    };
  }

  const milestone = prd.sections.milestones.find((item) => item.id === id);
  if (milestone) {
    return {
      kind: "milestone" as const,
      label: `Milestone: ${milestone.title}`,
    };
  }

  return null;
}

export function getFocusMeta(prd: PRD, nodeIds: string[]): FocusMeta | null {
  if (nodeIds.length === 0) {
    return null;
  }

  const resolved = nodeIds
    .map((id) => resolveFocusLabel(prd, id))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (resolved.length === 0) {
    return null;
  }

  const kinds = new Set(resolved.map((item) => item.kind));
  const [first] = resolved;
  if (!first) {
    return null;
  }

  const kind = kinds.size === 1 ? first.kind : "mixed";
  const label =
    resolved.length === 1
      ? first.label
      : `${first.label} +${resolved.length - 1}`;

  return {
    count: resolved.length,
    kind,
    label,
  };
}
