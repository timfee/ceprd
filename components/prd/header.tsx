"use client";

import { Download, Info, Target } from "lucide-react";
import { type ChangeEvent, useCallback, useMemo } from "react";

import { type DiscoveryMode } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePRDStore } from "@/lib/store";
import { FocusBadge } from "@/components/focus-badge";
import { getFocusMeta } from "@/lib/focus";

export function PRDHeader() {
  const { discoveryMode, status, title } = usePRDStore(
    (state) => state.prd.meta
  );
  const activeNodeIds = usePRDStore((state) => state.activeNodeIds);
  const focusMode = usePRDStore((state) => state.focusMode);
  const updateTitle = usePRDStore((state) => state.actions.updateTitle);
  const setDiscoveryMode = usePRDStore(
    (state) => state.actions.setDiscoveryMode
  );
  const { clearActiveFocus } = usePRDStore((state) => state.actions);
  const prd = usePRDStore((state) => state.prd);

  const handleExport = useCallback(() => {
    function slugify(value: string) {
      return value
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, "");
    }

    function shortId(id: string) {
      return id.replaceAll("-", "").slice(0, 6);
    }

    function makeRef(prefix: string, id: string, titleText: string) {
      const idShort = shortId(id);
      const anchor = `${prefix}-${idShort}-${slugify(titleText)}`;
      const label = `${prefix.toUpperCase()}-${idShort}: ${titleText}`;
      return {
        anchor,
        label,
        link: `[${label}](#${anchor})`,
      };
    }

    const actorRefs = new Map(
      prd.context.actors.map((actor) => [
        actor.id,
        makeRef("a", actor.id, actor.name),
      ])
    );
    const goalRefs = new Map(
      prd.sections.goals.map((goal) => [
        goal.id,
        makeRef("g", goal.id, goal.title),
      ])
    );
    const requirementRefs = new Map(
      prd.sections.requirements.map((requirement) => [
        requirement.id,
        makeRef("r", requirement.id, requirement.title),
      ])
    );
    const milestoneRefs = new Map(
      prd.sections.milestones.map((milestone) => [
        milestone.id,
        makeRef("ms", milestone.id, milestone.title),
      ])
    );
    const termRefs = new Map(
      prd.context.glossary.map((term) => [
        term.id,
        makeRef("t", term.id, term.term),
      ])
    );
    const competitorRefs = new Map(
      prd.context.competitors.map((competitor) => [
        competitor.id,
        makeRef("c", competitor.id, competitor.name),
      ])
    );

    function formatTrace(links: string[]) {
      return `Trace: ${links.length > 0 ? links.join(", ") : "None"}`;
    }

    const markdown = `
# ${prd.meta.title}
*Status: ${prd.meta.status} | Version: ${prd.meta.version}*

## TL;DR
**Problem:** ${prd.sections.tldr.problem || "N/A"}
**Solution:** ${prd.sections.tldr.solution || "N/A"}

## Context & Background
${prd.sections.background.context || "N/A"}

### Market Drivers
${
  prd.sections.background.marketDrivers
    .map((driver) => `- ${driver}`)
    .join("\n") || "None defined"
}

## Actors & Personas
${
  prd.context.actors.length > 0
    ? prd.context.actors
        .map((actor) => {
          const ref =
            actorRefs.get(actor.id) ?? makeRef("a", actor.id, actor.name);
          return `### <a id="${ref.anchor}"></a>${ref.label}\n**Role:** ${
            actor.role
          }\n${actor.description || "No description"}`;
        })
        .join("\n\n")
    : "None defined"
}

## Goals
${
  prd.sections.goals.length > 0
    ? prd.sections.goals
        .map((goal) => {
          const ref =
            goalRefs.get(goal.id) ?? makeRef("g", goal.id, goal.title);
          const metrics = goal.metrics
            .map((metric) => {
              const metricRef = makeRef("m", metric.id, metric.description);
              return `- <a id="${metricRef.anchor}"></a>${metricRef.link} (${metric.type})\n  - Target: ${
                metric.target
              }\n  - Baseline: ${metric.baseline || "N/A"}`;
            })
            .join("\n");
          const traceLinks = goal.metrics.map(
            (metric) => makeRef("m", metric.id, metric.description).link
          );
          return `### <a id="${ref.anchor}"></a>${ref.label} (${goal.priority})\n${
            goal.description
          }\n\n#### Success Criteria\n${
            metrics || "None defined"
          }\n\n${formatTrace(traceLinks)}`;
        })
        .join("\n\n")
    : "None defined"
}

## Requirements
${
  prd.sections.requirements.length > 0
    ? prd.sections.requirements
        .map((requirement) => {
          const ref =
            requirementRefs.get(requirement.id) ??
            makeRef("r", requirement.id, requirement.title);
          const primaryActor = actorRefs.get(requirement.primaryActorId);
          const secondaryActors = requirement.secondaryActorIds
            .map((id) => actorRefs.get(id)?.link)
            .filter((link): link is string => link !== undefined);
          const relatedGoals = requirement.relatedGoalIds
            .map((id) => goalRefs.get(id)?.link)
            .filter((link): link is string => link !== undefined);
          const traceLinks = [
            primaryActor?.link,
            ...secondaryActors,
            ...relatedGoals,
          ].filter((link): link is string => link !== undefined);

          return `### <a id="${ref.anchor}"></a>${ref.label} (${requirement.priority})\n${
            requirement.description
          }\n\n**Primary Actor:** ${
            primaryActor?.link || "Unassigned"
          }\n**Secondary Actors:** ${
            secondaryActors.length > 0 ? secondaryActors.join(", ") : "None"
          }\n**Related Goals:** ${
            relatedGoals.length > 0 ? relatedGoals.join(", ") : "None"
          }\n\n${formatTrace(traceLinks)}`;
        })
        .join("\n\n")
    : "None defined"
}

## Competitive Landscape
${
  prd.context.competitors.length > 0
    ? prd.context.competitors
        .map((competitor) => {
          const ref =
            competitorRefs.get(competitor.id) ??
            makeRef("c", competitor.id, competitor.name);
          return `### <a id="${ref.anchor}"></a>${ref.label}\n**Strengths:** ${
            competitor.strengths.join(", ") || "None"
          }\n**Weaknesses:** ${
            competitor.weaknesses.join(", ") || "None"
          }\n**Gaps:** ${competitor.featureGaps.join(", ") || "None"}`;
        })
        .join("\n\n")
    : "None defined"
}

## Glossary
${
  prd.context.glossary.length > 0
    ? prd.context.glossary
        .map((term) => {
          const ref = termRefs.get(term.id) ?? makeRef("t", term.id, term.term);
          return `### <a id="${ref.anchor}"></a>${ref.label}\n${
            term.definition
          }\n**Banned Synonyms:** ${
            term.bannedSynonyms.length > 0
              ? term.bannedSynonyms.join(", ")
              : "None"
          }`;
        })
        .join("\n\n")
    : "None defined"
}

## Milestones
${
  prd.sections.milestones.length > 0
    ? prd.sections.milestones
        .map((milestone) => {
          const ref =
            milestoneRefs.get(milestone.id) ??
            makeRef("ms", milestone.id, milestone.title);
          const requirementLinks = milestone.includedRequirementIds
            .map((id) => requirementRefs.get(id)?.link)
            .filter((link): link is string => link !== undefined);
          return `### <a id="${ref.anchor}"></a>${ref.label}\n**Target:** ${
            milestone.targetDate || "TBD"
          }\n**Exit Criteria:** ${
            milestone.exitCriteria.length > 0
              ? milestone.exitCriteria.map((item) => `- ${item}`).join("\n")
              : "None"
          }\n**Included Requirements:** ${
            requirementLinks.length > 0 ? requirementLinks.join(", ") : "None"
          }\n\n${formatTrace(requirementLinks)}`;
        })
        .join("\n\n")
    : "None defined"
}
    `;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prd.meta.title.replaceAll(/\s+/g, "-").toLowerCase()}.md`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [prd]);

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateTitle(e.target.value);
    },
    [updateTitle]
  );

  const handleDiscoveryModeChange = useCallback(
    (value: string) => {
      setDiscoveryMode(value as DiscoveryMode);
    },
    [setDiscoveryMode]
  );

  const focusMeta = useMemo(
    () => getFocusMeta(prd, activeNodeIds),
    [activeNodeIds, prd]
  );

  const focusBadge = useMemo(() => {
    if (!focusMode) {
      return (
        <div className="flex items-center gap-2 rounded-full border border-muted-foreground/30 bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground/70">
          <Target className="h-3 w-3" />
          Focus Off
        </div>
      );
    }

    if (!focusMeta) {
      return (
        <FocusBadge label="Focus: None" onClear={clearActiveFocus} subdued />
      );
    }

    return (
      <FocusBadge
        kind={focusMeta.kind}
        label={focusMeta.label}
        onClear={clearActiveFocus}
      />
    );
  }, [clearActiveFocus, focusMeta, focusMode]);

  return (
    <div className="flex items-center justify-between border-b bg-background p-6">
      <div className="mr-8 flex-1">
        <Input
          className="h-auto border-0 bg-transparent px-0 font-bold text-2xl shadow-none ring-0 ring-offset-0 transition-colors hover:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          onChange={handleTitleChange}
          value={title}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Discovery
          </span>
          <span
            className="text-muted-foreground"
            title="Controls whether the AI proposes new actors, terms, goals, and requirements. Default adds only highest-signal new items."
          >
            <Info className="h-3.5 w-3.5" />
          </span>
          <Select
            onValueChange={handleDiscoveryModeChange}
            value={discoveryMode}
          >
            <SelectTrigger className="h-7 w-[160px] text-xs">
              <SelectValue placeholder="Discovery mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Only highest signal</SelectItem>
              <SelectItem value="off">Never discover</SelectItem>
              <SelectItem value="on">Bias toward discovery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {focusBadge}
        <Badge variant={status === "Final" ? "default" : "secondary"}>
          {status}
        </Badge>
        <Button
          onClick={handleExport}
          size="sm"
          variant="outline"
          className="cursor-pointer bg-transparent"
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>
    </div>
  );
}
