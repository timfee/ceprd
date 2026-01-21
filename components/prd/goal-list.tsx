"use client";

import { Plus, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { type Goal } from "@/lib/types";

interface GoalItemProps {
  goal: Goal;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
}

const GoalItem = memo(({ goal, onRemove, onUpdate }: GoalItemProps) => {
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(goal.id, { title: e.target.value });
    },
    [goal.id, onUpdate]
  );

  const handlePriorityChange = useCallback(
    (v: string) => {
      const priority = v as "Critical" | "High" | "Medium";
      onUpdate(goal.id, { priority });
    },
    [goal.id, onUpdate]
  );

  const handleRemove = useCallback(() => {
    onRemove(goal.id);
  }, [goal.id, onRemove]);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(goal.id, { description: e.target.value });
    },
    [goal.id, onUpdate]
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
            <Input
              className="h-auto border-0 px-0 font-medium text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0"
              onChange={handleTitleChange}
              placeholder="Goal Title"
              value={goal.title}
            />
            <Select onValueChange={handlePriorityChange} value={goal.priority}>
              <SelectTrigger className="h-6 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            size="icon"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          className="min-h-[80px] resize-none text-sm"
          onChange={handleDescriptionChange}
          placeholder="Description of the goal..."
          value={goal.description}
        />
      </CardContent>
    </Card>
  );
});

GoalItem.displayName = "GoalItem";

/**
 * List of project goals and success metrics.
 */
export function GoalList() {
  const goals = usePRDStore((state) => state.prd.sections.goals);
  const { addGoal, updateGoal, removeGoal } = usePRDStore(
    (state) => state.actions
  );

  const handleAdd = useCallback(() => {
    addGoal({
      description: "",
      metrics: [],
      priority: "High",
      title: "New Goal",
    });
  }, [addGoal]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">Goals & Success Metrics</h2>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            onRemove={removeGoal}
            onUpdate={updateGoal}
          />
        ))}

        {goals.length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
            No goals yet. Click &quot;Add Goal&quot; to define success.
          </div>
        )}
      </div>
    </div>
  );
}
