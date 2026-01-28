"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  MoreHorizontal,
  PlusCircle,
  Target,
  Trash2,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { type Actor, type Requirement } from "@/lib/schemas";

import { generateRequirementDescription } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AIToolbar } from "./ai-toolbar";
import { Badge } from "@/components/ui/badge";

function getPriorityColor(p: string) {
  switch (p) {
    case "P0": {
      return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50";
    }
    case "P1": {
      return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50";
    }
    case "P2": {
      return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50";
    }
    case "P3": {
      return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
    default: {
      return "bg-slate-100 text-slate-700";
    }
  }
}

interface RequirementItemProps {
  req: Requirement;
  index: number;
  isLast: boolean;
  actors: Actor[];
}

const RequirementItem = memo(
  ({ req, index, isLast, actors }: RequirementItemProps) => {
    const {
      setActiveFocus,
      updateRequirement,
      removeRequirement,
      moveRequirement,
    } = usePRDStore((state) => state.actions);
    const activeNodeIds = usePRDStore((state) => state.activeNodeIds);
    const focusMode = usePRDStore((state) => state.focusMode);

    // Context selectors
    const background = usePRDStore(
      (state) => state.prd.sections.background.context
    );
    const goals = usePRDStore((state) => state.prd.sections.goals);
    const competitors = usePRDStore((state) => state.prd.context.competitors);
    const glossary = usePRDStore((state) => state.prd.context.glossary);

    const [isExpanded, setIsExpanded] = useState(
      !req.title && !req.description
    );
    const [isGenerating, setIsGenerating] = useState(false);

    const handleTitleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateRequirement(req.id, { title: e.target.value });
      },
      [req.id, updateRequirement]
    );

    const handleItemFocus = useCallback(() => {
      setActiveFocus("requirements", [req.id]);
    }, [req.id, setActiveFocus]);

    const isFocused = activeNodeIds.includes(req.id);
    const shouldDim = focusMode && activeNodeIds.length > 0 && !isFocused;

    const handleGoalFocus = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        const { goalId } = event.currentTarget.dataset;
        if (!goalId) {
          return;
        }
        setActiveFocus("goals", [goalId]);
      },
      [setActiveFocus]
    );

    const handlePriorityCycle = useCallback(() => {
      const priorities: Requirement["priority"][] = ["P0", "P1", "P2", "P3"];
      const currentIndex = priorities.indexOf(req.priority);
      const nextIndex = (currentIndex + 1) % priorities.length;
      updateRequirement(req.id, { priority: priorities[nextIndex] });
    }, [req.id, req.priority, updateRequirement]);

    const handleStatusChange = useCallback(
      (value: string) => {
        updateRequirement(req.id, { status: value as Requirement["status"] });
      },
      [req.id, updateRequirement]
    );

    const handleActorChange = useCallback(
      (value: string) => {
        updateRequirement(req.id, { primaryActorId: value });
      },
      [req.id, updateRequirement]
    );

    const handleDescriptionChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateRequirement(req.id, { description: e.target.value });
      },
      [req.id, updateRequirement]
    );

    const handleMoveUp = useCallback(() => {
      moveRequirement(req.id, "up");
    }, [req.id, moveRequirement]);

    const handleMoveDown = useCallback(() => {
      moveRequirement(req.id, "down");
    }, [req.id, moveRequirement]);

    const handleRemove = useCallback(() => {
      removeRequirement(req.id);
    }, [req.id, removeRequirement]);

    // AI Handlers
    const handleGenerateDescription = useCallback(async () => {
      if (!req.title) {
        return;
      }
      setIsGenerating(true);
      try {
        // Collect Active Context
        const activeCompetitors = competitors.filter((c) => c.selected);
        const competitorContext = activeCompetitors.flatMap((c) =>
          c.featureGaps.map((gap) => `Competitor ${c.name} has gap: ${gap}`)
        );
        const activeGoals = goals.map((g) => ({ id: g.id, title: g.title }));
        const activeGlossary = glossary.map((t) => t.term);

        const result = await generateRequirementDescription(
          req.title,
          req.type,
          actors,
          {
            background,
            competitorContext:
              competitorContext.length > 0 ? competitorContext : undefined,
            glossary: activeGlossary.length > 0 ? activeGlossary : undefined,
            goals: activeGoals.length > 0 ? activeGoals : undefined,
          }
        );

        // Resolve Actor Name to ID
        let foundActorId = req.primaryActorId;
        if (result.primaryActorName) {
          const matchingActor = actors.find(
            (a) =>
              a.name.toLowerCase() === result.primaryActorName?.toLowerCase()
          );
          if (matchingActor) {
            foundActorId = matchingActor.id;
          }
        }

        updateRequirement(req.id, {
          description: result.description,
          primaryActorId: foundActorId,
          relatedGoalIds: result.relatedGoalIds || [],
        });
        toast.success("Description generated and linked!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to generate description");
      } finally {
        setIsGenerating(false);
      }
    }, [
      req.title,
      req.type,
      req.id,
      req.primaryActorId,
      actors,
      background,
      goals,
      competitors,
      glossary,
      updateRequirement,
    ]);

    const handleGenerate = req.description
      ? undefined
      : handleGenerateDescription;

    const handleExpand = useCallback(() => {
      setIsExpanded(true);
    }, []);

    const handleTitleFocus = useCallback(() => {
      handleExpand();
      handleItemFocus();
    }, [handleExpand, handleItemFocus]);

    const handleExpandToggle = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const activeContextCount = competitors.filter((c) => c.selected).length;

    return (
      <div
        className={cn(
          "group flex flex-col rounded-lg border bg-card transition-all hover:border-foreground/20 hover:shadow-sm",
          isFocused &&
            "border-primary/60 ring-1 ring-primary/20 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]",
          shouldDim && "opacity-60"
        )}
      >
        {/* Header Row */}
        <div className="flex h-12 items-center gap-3 px-3">
          <div className="flex w-6 flex-col items-center justify-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-3 w-4 p-0 text-muted-foreground hover:text-foreground"
              disabled={index === 0}
              onClick={handleMoveUp}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <GripVertical className="h-3 w-3 text-muted-foreground/50" />
            <Button
              variant="ghost"
              size="icon"
              className="h-3 w-4 p-0 text-muted-foreground hover:text-foreground"
              disabled={isLast}
              onClick={handleMoveDown}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {index + 1}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              className="h-8 border-transparent bg-transparent px-0 text-sm font-medium focus-visible:ring-0 placeholder:text-muted-foreground/50"
              value={req.title}
              onChange={handleTitleChange}
              placeholder="Requirement Title (e.g. User Login)"
              onFocus={handleTitleFocus}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              aria-label="Focus requirement"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleItemFocus}
              size="icon"
              variant="ghost"
              title="Spotlight this requirement"
            >
              <Target className="h-4 w-4" />
            </Button>
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer font-normal",
                getPriorityColor(req.priority)
              )}
              onClick={handlePriorityCycle}
            >
              {req.priority}
            </Badge>

            <Select onValueChange={handleStatusChange} value={req.status}>
              <SelectTrigger className="h-8" id={`status-${req.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Proposed">Proposed</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleRemove}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Requirement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleExpandToggle}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Expanded Body */}
        {isExpanded && (
          <div className="border-t bg-muted/10 p-4 animate-in slide-in-from-top-1 duration-200">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`desc-${req.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Description / Acceptance Criteria
                    </label>
                    <Select
                      value={req.primaryActorId}
                      onValueChange={handleActorChange}
                    >
                      <SelectTrigger className="h-6 w-[140px] text-xs border-transparent bg-transparent hover:bg-muted/50">
                        <SelectValue placeholder="Assign Actor" />
                      </SelectTrigger>
                      <SelectContent>
                        {actors.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                        {actors.length === 0 && (
                          <SelectItem value="none" disabled>
                            No Actors
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeContextCount > 0 && (
                      <span className="rounded-sm bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Using {activeContextCount} active competitor
                        {activeContextCount === 1 ? "" : "s"}
                      </span>
                    )}
                    <AIToolbar
                      generateLabel="Draft with AI"
                      hasContent={!!req.description}
                      isGenerating={isGenerating}
                      onGenerate={handleGenerate}
                    />
                  </div>
                </div>
                <Textarea
                  id={`desc-${req.id}`}
                  className="min-h-[120px] resize-y bg-background text-sm leading-relaxed"
                  value={req.description}
                  onChange={handleDescriptionChange}
                  placeholder="As a [User], I want to [Action] so that [Benefit]..."
                  onFocus={handleItemFocus}
                />

                {req.relatedGoalIds && req.relatedGoalIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Linked Goals:
                    </span>
                    {req.relatedGoalIds.map((goalId) => {
                      const goal = goals.find((g) => g.id === goalId);
                      if (!goal) {
                        return null;
                      }
                      return (
                        <Badge asChild key={goalId} variant="secondary">
                          <button
                            className="h-5 cursor-pointer px-1.5 py-0 text-[10px] font-normal"
                            data-goal-id={goalId}
                            onClick={handleGoalFocus}
                            type="button"
                          >
                            {goal.title}
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

RequirementItem.displayName = "RequirementItem";

export function RequirementList() {
  const requirements = usePRDStore((state) => state.prd.sections.requirements);
  const actors = usePRDStore((state) => state.prd.context.actors);
  const { addRequirement } = usePRDStore((state) => state.actions);

  const handleAdd = useCallback(() => {
    addRequirement({
      description: "",
      primaryActorId: actors[0]?.id || "",
      priority: "P2",
      relatedGoalIds: [],
      secondaryActorIds: [],
      status: "Draft",
      title: "",
      type: "User Story",
    });
  }, [addRequirement, actors]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Define functional specifications and acceptance criteria.
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          Add Requirement
        </Button>
      </div>

      {requirements.length === 0 ? (
        <EmptyState
          actionLabel="Create your first requirement"
          description="Start adding requirements to define your product scope."
          onAction={handleAdd}
          title="No requirements yet"
        />
      ) : (
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <RequirementItem
              key={req.id}
              req={req}
              index={index}
              isLast={index === requirements.length - 1}
              actors={actors}
            />
          ))}
        </div>
      )}
    </div>
  );
}
