"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { evaluateRequirement } from "@/app/actions";
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
import type { Actor, Requirement } from "@/lib/schemas";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * List of functional requirements with AI evaluation capabilities.
 */
export function RequirementList() {
  const requirements = usePRDStore((state) => state.prd.sections.requirements);
  const actors = usePRDStore((state) => state.prd.context.actors);
  const { addRequirement } = usePRDStore((state) => state.actions);

  const handleAdd = () => {
    addRequirement({
      title: "New Requirement",
      description: "",
      priority: "P1",
      status: "Draft",
      primaryActorId: actors[0]?.id || "",
      secondaryActorIds: [],
      type: "User Story",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">Functional Requirements</h2>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Requirement
        </Button>
      </div>

      <div className="space-y-4">
        {requirements.map((req) => (
          <RequirementItem actors={actors} key={req.id} req={req} />
        ))}

        {requirements.length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
            No requirements yet. Click "Add Requirement" to start building.
          </div>
        )}
      </div>
    </div>
  );
}

import { validateRequirementRules } from "@/lib/validate-rules";

function RequirementItem({
  req,
  actors,
}: {
  req: Requirement;
  actors: Actor[];
}) {
  const { updateRequirement, removeRequirement } = usePRDStore(
    (state) => state.actions
  );
  const [evalStatus, setEvalStatus] = useState<
    "idle" | "loading" | "pass" | "fail"
  >("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const runEval = async () => {
    setEvalStatus("loading");
    setFeedback(null);

    // 1. Deterministic Rule Check (Fast, Cheap)
    const ruleResult = validateRequirementRules(req, actors);
    if (ruleResult.status === "FAIL") {
      setEvalStatus("fail");
      setFeedback(`${ruleResult.issue} ${ruleResult.suggestion}`);
      return;
    }

    // 2. AI Critique (Deep, Contextual)
    try {
      const result = await evaluateRequirement(req, actors);
      const data = result;

      if (data?.status === "PASS") {
        setEvalStatus("pass");
        setFeedback(null);
      } else {
        setEvalStatus("fail");
        setFeedback(data?.issue || data?.suggestion || "Issue found");
      }
    } catch (e) {
      console.error(e);
      setEvalStatus("idle");
    }
  };

  let statusColor = "border-l-transparent";
  if (evalStatus === "pass") {
    statusColor = "border-l-green-500";
  } else if (evalStatus === "fail") {
    statusColor = "border-l-red-500";
  }

  let buttonColor = "";
  if (evalStatus === "pass") {
    buttonColor = "border-green-200 bg-green-50 text-green-600";
  } else if (evalStatus === "fail") {
    buttonColor = "border-red-200 bg-red-50 text-red-600";
  }

  const renderIcon = () => {
    if (evalStatus === "loading") {
      return <Loader2 className="mr-2 h-3 w-3 animate-spin" />;
    }
    if (evalStatus === "pass") {
      return <CheckCircle2 className="mr-2 h-3 w-3" />;
    }
    if (evalStatus === "fail") {
      return <AlertCircle className="mr-2 h-3 w-3" />;
    }
    return <Sparkles className="mr-2 h-3 w-3 text-purple-500" />;
  };

  const renderLabel = () => {
    if (evalStatus === "pass") {
      return "Passed";
    }
    if (evalStatus === "fail") {
      return "Fix Issue";
    }
    return "Review";
  };

  return (
    <Card className={cn("border-l-4 transition-colors", statusColor)}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
            <Input
              className="h-auto border-0 px-0 font-medium text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0"
              onChange={(e) =>
                updateRequirement(req.id, { title: e.target.value })
              }
              placeholder="Requirement Title (e.g., User Login)"
              value={req.title}
            />
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(v) => {
                  const val = v as "P0" | "P1" | "P2" | "P3";
                  updateRequirement(req.id, {
                    priority: val,
                  });
                }}
                value={req.priority}
              >
                <SelectTrigger className="h-6 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">P0</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(v) =>
                  updateRequirement(req.id, { primaryActorId: v })
                }
                value={req.primaryActorId}
              >
                <SelectTrigger className="h-6 w-[140px] text-xs">
                  <SelectValue placeholder="Select Actor" />
                </SelectTrigger>
                <SelectContent>
                  {actors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                  {actors.length === 0 && (
                    <SelectItem disabled value="none">
                      No Actors Defined
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className={cn("w-32", buttonColor)}
              disabled={evalStatus === "loading"}
              onClick={runEval}
              size="sm"
              variant="outline"
            >
              {renderIcon()}
              {renderLabel()}
            </Button>

            <Button
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeRequirement(req.id)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Textarea
          className="min-h-[80px] resize-none text-sm"
          onChange={(e) =>
            updateRequirement(req.id, { description: e.target.value })
          }
          placeholder="As a [Actor], I want to [Action], so that [Benefit]..."
          value={req.description}
        />

        {feedback && (
          <div className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-red-700 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Critique:</span> {feedback}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
