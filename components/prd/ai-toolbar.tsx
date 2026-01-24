"use client";

import {
  Sparkles,
  ChevronDown,
  Wand2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { memo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AIInstruction =
  | "Make longer"
  | "Make shorter"
  | "Rewrite"
  | "Fix grammar"
  | "Simplify"
  | "Professional Tone";

interface AIToolbarProps {
  onGenerate?: () => void;
  onRefine?: (instruction: AIInstruction) => void;
  onCheckQuality?: () => void;
  isGenerating?: boolean;
  hasContent?: boolean;
  qualityStatus?: "idle" | "loading" | "pass" | "fail";
  className?: string;
  generateLabel?: string;
}

export const AIToolbar = memo(
  ({
    onGenerate,
    onRefine,
    onCheckQuality,
    isGenerating,
    hasContent,
    qualityStatus,
    className,
    generateLabel = "Generate",
  }: AIToolbarProps) => {
    const handleRefine = useCallback(
      (instruction: AIInstruction) => {
        onRefine?.(instruction);
      },
      [onRefine]
    );

    const handleRewrite = useCallback(
      () => handleRefine("Rewrite"),
      [handleRefine]
    );
    const handleMakeLonger = useCallback(
      () => handleRefine("Make longer"),
      [handleRefine]
    );
    const handleMakeShorter = useCallback(
      () => handleRefine("Make shorter"),
      [handleRefine]
    );
    const handleFixGrammar = useCallback(
      () => handleRefine("Fix grammar"),
      [handleRefine]
    );
    const handleSimplify = useCallback(
      () => handleRefine("Simplify"),
      [handleRefine]
    );
    const handleProfessionalTone = useCallback(
      () => handleRefine("Professional Tone"),
      [handleRefine]
    );

    function getQualityButtonClass() {
      if (qualityStatus === "pass") {
        return "text-green-600 hover:text-green-700 hover:bg-green-50";
      }
      if (qualityStatus === "fail") {
        return "text-red-600 hover:text-red-700 hover:bg-red-50";
      }
      return "text-muted-foreground hover:text-foreground";
    }

    function getQualityLabel() {
      if (qualityStatus === "pass") {
        return "Passed";
      }
      if (qualityStatus === "fail") {
        return "Issues Found";
      }
      return "Check Quality";
    }

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Primary Generation Action (if empty or specific generation needed) */}
        {onGenerate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="h-7 text-xs gap-1.5 text-ai hover:text-ai hover:bg-ai/10"
          >
            {isGenerating ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {isGenerating ? "Working..." : generateLabel}
          </Button>
        )}

        {/* Refinement Dropdown (if content exists) */}
        {onRefine && hasContent && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isGenerating}
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Wand2 className="h-3 w-3" />
                Refine
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleRewrite}>
                Rewrite
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMakeLonger}>
                Make longer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMakeShorter}>
                Make shorter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFixGrammar}>
                Fix grammar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSimplify}>
                Simplify language
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfessionalTone}>
                Professional tone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Quality Check (Specific to Requirements) */}
        {onCheckQuality && hasContent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCheckQuality}
            disabled={qualityStatus === "loading"}
            className={cn("h-7 text-xs gap-1.5", getQualityButtonClass())}
          >
            {qualityStatus === "loading" ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {getQualityLabel()}
          </Button>
        )}
      </div>
    );
  }
);

AIToolbar.displayName = "AIToolbar";
