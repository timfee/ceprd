"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePRDStore } from "@/lib/store";

/**
 * List of project milestones and target dates.
 */
export function MilestoneList() {
  const milestones = usePRDStore((state) => state.prd.sections.milestones);
  const { addMilestone, updateMilestone, removeMilestone } = usePRDStore(
    (state) => state.actions
  );

  const handleAdd = () => {
    addMilestone({
      title: "New Milestone",
      targetDate: "",
      includedRequirementIds: [],
      exitCriteria: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">Milestones & Execution</h2>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Milestone
        </Button>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <Card key={milestone.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Input
                    className="h-auto border-0 px-0 font-medium text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0"
                    onChange={(e) =>
                      updateMilestone(milestone.id, { title: e.target.value })
                    }
                    placeholder="Milestone Title (e.g., MVP)"
                    value={milestone.title}
                  />
                  <Input
                    className="h-6 w-[150px] text-xs"
                    onChange={(e) =>
                      updateMilestone(milestone.id, {
                        targetDate: e.target.value,
                      })
                    }
                    placeholder="Target Date (e.g., Q3 2025)"
                    value={milestone.targetDate ?? ""}
                  />
                </div>
                <Button
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMilestone(milestone.id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {milestones.length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
            No milestones defined. Click "Add Milestone" to plan execution.
          </div>
        )}
      </div>
    </div>
  );
}
