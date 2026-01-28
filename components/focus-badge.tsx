import { Target, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FocusKind =
  | "actor"
  | "competitor"
  | "goal"
  | "milestone"
  | "requirement"
  | "term"
  | "mixed";

const FOCUS_KIND_STYLES: Record<FocusKind, string> = {
  actor: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  competitor: "border-orange-500/20 bg-orange-500/10 text-orange-700",
  goal: "border-blue-500/20 bg-blue-500/10 text-blue-700",
  milestone: "border-purple-500/20 bg-purple-500/10 text-purple-700",
  mixed: "border-ai-border bg-ai-muted/30 text-muted-foreground",
  requirement: "border-green-500/20 bg-green-500/10 text-green-700",
  term: "border-amber-500/20 bg-amber-500/10 text-amber-700",
};

interface FocusBadgeProps {
  kind?: FocusKind;
  label: string;
  onClear: () => void;
  subdued?: boolean;
}

export function FocusBadge({ kind, label, onClear, subdued }: FocusBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-2 py-1 text-[10px]",
        subdued
          ? "border-muted-foreground/30 bg-muted/40 text-muted-foreground/70"
          : FOCUS_KIND_STYLES[kind ?? "mixed"]
      )}
    >
      <Target className="h-3 w-3" />
      <span>{label}</span>
      <Button
        className="h-4 w-4 p-0 text-muted-foreground"
        onClick={onClear}
        size="icon"
        variant="ghost"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
