import {
  Calendar,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { refineText } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";
import { type Milestone } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { AIToolbar, type AIInstruction } from "./ai-toolbar";

interface MilestoneItemProps {
  milestone: Milestone;
  index: number;
}

const MilestoneItem = memo(({ milestone, index }: MilestoneItemProps) => {
  const { updateMilestone, removeMilestone } = usePRDStore(
    (state) => state.actions
  );
  const [isExpanded, setIsExpanded] = useState(
    !milestone.title && !milestone.targetDate
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateMilestone(milestone.id, { title: e.target.value });
    },
    [milestone.id, updateMilestone]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateMilestone(milestone.id, { targetDate: e.target.value });
    },
    [milestone.id, updateMilestone]
  );

  const handleRemove = useCallback(() => {
    removeMilestone(milestone.id);
  }, [milestone.id, removeMilestone]);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleRefine = useCallback(
    async (instruction: AIInstruction) => {
      if (!milestone.title) {
        return;
      }
      setIsGenerating(true);
      try {
        const refined = await refineText(
          milestone.title,
          instruction,
          `Milestone Context`
        );
        updateMilestone(milestone.id, { title: refined });
        toast.success("Refined successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to refine");
      } finally {
        setIsGenerating(false);
      }
    },
    [milestone.title, milestone.id, updateMilestone]
  );

  const handleExitCriteriaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateMilestone(milestone.id, {
        exitCriteria: e.target.value.split("\n"),
      });
    },
    [milestone.id, updateMilestone]
  );

  return (
    <div className="group flex flex-col rounded-lg border bg-card transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex h-12 items-center gap-3 px-3">
        {/* Icon/Number */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
          {index + 1}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            className="h-8 border-transparent bg-transparent px-0 text-sm font-medium focus-visible:ring-0 placeholder:text-muted-foreground/50"
            onChange={handleTitleChange}
            placeholder="e.g. MVP Release"
            value={milestone.title}
            onFocus={handleExpand}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              className="h-8 w-[140px] border-transparent bg-transparent text-right text-xs focus-visible:ring-0 placeholder:text-muted-foreground/50"
              onChange={handleDateChange}
              placeholder="Q1 2024"
              value={milestone.targetDate || ""}
            />
          </div>

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
                Delete Milestone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleExpandToggle}
          >
            <div
              className={cn(
                "transition-transform duration-200",
                isExpanded ? "rotate-90" : ""
              )}
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </div>
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-muted/10 p-4 animate-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={`criteria-${milestone.id}`}
              >
                Scope / Exit Criteria (One per line)
              </label>
              <AIToolbar
                onRefine={handleRefine}
                isGenerating={isGenerating}
                hasContent={!!milestone.title}
                generateLabel="Refine Title"
              />
            </div>
            <Textarea
              className="min-h-[100px] resize-y bg-background text-sm leading-relaxed"
              id={`criteria-${milestone.id}`}
              onChange={handleExitCriteriaChange}
              placeholder="List the key deliverables..."
              value={milestone.exitCriteria.join("\n")}
            />
          </div>
        </div>
      )}
    </div>
  );
});

MilestoneItem.displayName = "MilestoneItem";

/**
 * List of project milestones and target dates.
 */
export function MilestoneList() {
  const milestones = usePRDStore((state) => state.prd.sections.milestones);
  const { addMilestone } = usePRDStore((state) => state.actions);

  const handleAdd = useCallback(() => {
    addMilestone({
      exitCriteria: [],
      includedRequirementIds: [],
      targetDate: "",
      title: "",
    });
  }, [addMilestone]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Milestones & Execution
          </h2>
          <p className="text-sm text-muted-foreground">
            Plan the delivery timeline and key phases.
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      <div className="space-y-2">
        {milestones.length === 0 ? (
          <EmptyState
            actionLabel="Add Milestone"
            description="No milestones defined. Create a timeline for your project execution."
            icon={Calendar}
            onAction={handleAdd}
            title="No milestones yet"
          />
        ) : (
          milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}
