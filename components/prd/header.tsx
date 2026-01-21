"use client";

import { Download } from "lucide-react";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePRDStore } from "@/lib/store";

/**
 * Header component displaying the PRD title and export options.
 */
export function PRDHeader() {
  const { title, status } = usePRDStore((state) => state.prd.meta);
  const updateTitle = usePRDStore((state) => state.actions.updateTitle);
  const prd = usePRDStore((state) => state.prd);

  const handleExport = useCallback(() => {
    const markdown = `
# ${prd.meta.title}
*Status: ${prd.meta.status} | Version: ${prd.meta.version}*

## TL;DR
**Problem:** ${prd.sections.tldr.problem || "N/A"}
**Solution:** ${prd.sections.tldr.solution || "N/A"}

## Context & Background
${prd.sections.background.context || "N/A"}

### Market Drivers
${prd.sections.background.marketDrivers.map((d) => `- ${d}`).join("\n") || "None defined"}

## Actors & Personas
${prd.context.actors.map((a) => `- **${a.name}** (${a.role}): ${a.description || "No description"}`).join("\n")}

## Goals
${prd.sections.goals.map((g) => `### ${g.title} (${g.priority})\n${g.description}\n`).join("\n")}

## Requirements
${prd.sections.requirements
  .map(
    (r) =>
      `### ${r.title} (${r.priority})\n${r.description}\n*Assigned to: ${
        prd.context.actors.find((a) => a.id === r.primaryActorId)?.name ||
        "Unassigned"
      }*`
  )
  .join("\n\n")}

## Competitive Landscape
${prd.context.competitors
  .map(
    (c) =>
      `### ${c.name}\n**Strengths:** ${c.strengths.join(", ")}\n**Weaknesses:** ${c.weaknesses.join(", ")}\n**Gaps:** ${c.featureGaps.join(", ")}`
  )
  .join("\n\n")}

## Milestones
${prd.sections.milestones
  .map((m) => `- **${m.title}** (Target: ${m.targetDate || "TBD"})`)
  .join("\n")}
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTitle(e.target.value);
    },
    [updateTitle]
  );

  return (
    <div className="flex items-center justify-between border-b bg-background p-6">
      <div className="mr-8 flex-1">
        <Input
          className="h-auto border-transparent bg-transparent px-0 font-bold text-2xl shadow-none transition-colors hover:border-input focus:border-input"
          onChange={handleTitleChange}
          value={title}
        />
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={status === "Final" ? "default" : "secondary"}>
          {status}
        </Badge>
        <Button onClick={handleExport} size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>
    </div>
  );
}
