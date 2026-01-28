import {
  ChevronRight,
  MoreHorizontal,
  PlusCircle,
  Target,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";
import { type Goal } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { type AIInstruction, AIToolbar } from "./ai-toolbar";
import { Badge } from "@/components/ui/badge";

function getPriorityColor(p: string) {
  switch (p) {
    case "Critical": {
      return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50";
    }
    case "High": {
      return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50";
    }
    case "Medium": {
      return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50";
    }
    default: {
      return "bg-slate-100 text-slate-700";
    }
  }
}

interface GoalItemProps {
  goal: Goal;
  index: number;
}

const GoalItem = memo(({ goal, index }: GoalItemProps) => {
  const { setActiveFocus, updateGoal, removeGoal } = usePRDStore(
    (state) => state.actions
  );
  const activeNodeIds = usePRDStore((state) => state.activeNodeIds);
  const focusMode = usePRDStore((state) => state.focusMode);
  const [isExpanded, setIsExpanded] = useState(
    !goal.title && !goal.description
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateGoal(goal.id, { title: e.target.value });
    },
    [goal.id, updateGoal]
  );

  const handlePriorityChange = useCallback(
    (v: string) => {
      const priority = v as "Critical" | "High" | "Medium";
      updateGoal(goal.id, { priority });
    },
    [goal.id, updateGoal]
  );

  const handleRemove = useCallback(() => {
    removeGoal(goal.id);
  }, [goal.id, removeGoal]);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateGoal(goal.id, { description: e.target.value });
    },
    [goal.id, updateGoal]
  );

  const handleExpandToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleItemFocus = useCallback(() => {
    setActiveFocus("goals", [goal.id]);
  }, [goal.id, setActiveFocus]);

  const handleTitleFocus = useCallback(() => {
    handleExpand();
    handleItemFocus();
  }, [handleExpand, handleItemFocus]);

  const handleFocusClick = useCallback(() => {
    setActiveFocus("goals", [goal.id]);
  }, [goal.id, setActiveFocus]);

  const handleRefine = useCallback(
    async (instruction: AIInstruction) => {
      if (!goal.description) {
        return;
      }
      setIsGenerating(true);
      try {
        const refined = await refineText(
          goal.description,
          instruction,
          `Goal: ${goal.title}`
        );
        updateGoal(goal.id, { description: refined });
        toast.success("Refined successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to refine");
      } finally {
        setIsGenerating(false);
      }
    },
    [goal.description, goal.title, goal.id, updateGoal]
  );

  const isFocused = activeNodeIds.includes(goal.id);
  const shouldDim = focusMode && activeNodeIds.length > 0 && !isFocused;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-lg border bg-card transition-all hover:border-foreground/20 hover:shadow-sm",
        isFocused &&
          "border-primary/60 ring-1 ring-primary/20 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]",
        shouldDim && "opacity-60"
      )}
    >
      <div className="flex h-12 items-center gap-3 px-3">
        {/* Icon/Number */}
        <Button
          aria-label={`Focus goal ${goal.title || "Untitled"}`}
          className="h-8 w-8 shrink-0 rounded-full bg-primary/10 p-0 text-sm font-semibold text-primary"
          onClick={handleFocusClick}
          size="icon"
          variant="ghost"
        >
          {index + 1}
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            className="h-8 border-transparent bg-transparent px-0 text-sm font-medium focus-visible:ring-0 placeholder:text-muted-foreground/50"
            onChange={handleTitleChange}
            placeholder="e.g. Increase User Retention"
            value={goal.title}
            onFocus={handleTitleFocus}
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("font-normal", getPriorityColor(goal.priority))}
          >
            {goal.priority}
          </Badge>

          <Select onValueChange={handlePriorityChange} value={goal.priority}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
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
                Delete Goal
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

      {isExpanded && (
        <div className="border-t bg-muted/10 p-4 animate-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor={`desc-${goal.id}`}
              >
                Description / Success Metrics
              </label>
              <AIToolbar
                onRefine={handleRefine}
                isGenerating={isGenerating}
                hasContent={!!goal.description}
                generateLabel="Draft with AI"
              />
            </div>
            <Textarea
              id={`desc-${goal.id}`}
              className="min-h-[100px] resize-y bg-background text-sm leading-relaxed"
              onChange={handleDescriptionChange}
              placeholder="Describe the goal and how success will be measured..."
              value={goal.description}
              onFocus={handleItemFocus}
            />
          </div>
        </div>
      )}
    </div>
  );
});

GoalItem.displayName = "GoalItem";

/**
 * List of project goals and success metrics.
 */
export function GoalList() {
  const goals = usePRDStore((state) => state.prd.sections.goals);
  const { addGoal } = usePRDStore((state) => state.actions);

  const handleAdd = useCallback(() => {
    addGoal({
      description: "",
      metrics: [],
      priority: "High",
      title: "",
    });
  }, [addGoal]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Goals & Success Metrics
          </h2>
          <p className="text-sm text-muted-foreground">
            Define clear objectives and measurable outcomes.
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-2">
        {goals.length === 0 ? (
          <EmptyState
            actionLabel="Add Goal"
            description="No goals yet. Define success metrics to guide the project."
            icon={Target}
            onAction={handleAdd}
            title="No goals defined"
          />
        ) : (
          goals.map((goal, index) => (
            <GoalItem key={goal.id} goal={goal} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
