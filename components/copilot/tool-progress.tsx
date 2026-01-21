"use client";

import { Bot, Loader2 } from "lucide-react";
import { SkeletonCard, SkeletonList } from "@/components/ui/skeleton";

interface ToolProgressProps {
  toolName: string;
  state: string;
  currentStep?: number;
  message?: string;
}

/**
 * Visual indicator for tool execution progress.
 */
export function ToolProgress({
  toolName,
  state,
  currentStep = 0,
  message,
}: ToolProgressProps) {
  const isComplete = state === "output-available";
// ...

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 rounded border border-green-100 bg-green-50 p-2 text-green-600 text-xs">
        <Bot className="h-3 w-3" />
        <span className="font-medium">✓ {toolName} completed successfully</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-blue-100 bg-blue-50 p-3 text-blue-600 text-xs">
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="font-medium">Processing: {toolName}</span>
      </div>

      {toolName === "generateDraft" && (
        <div className="space-y-2">
          <div className="text-blue-500 text-xs">
            {message || "Generating PRD structure..."}
          </div>

          {/* Progress steps */}
          <div className="space-y-1">
            {[
              "Analyzing product idea",
              "Defining project scope",
              "Identifying key actors",
              "Generating requirements",
              "Creating milestones",
              "Setting up glossary",
            ].map((step, index) => (
              <div
                className={`flex items-center gap-2 ${
                  index <= currentStep ? "text-blue-700" : "text-blue-400"
                }`}
                key={step}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    index <= currentStep ? "bg-blue-700" : "bg-blue-300"
                  }`}
                />
                <span className="text-xs">{step}</span>
              </div>
            ))}
          </div>

          {/* Skeleton preview */}
          <div className="mt-3 space-y-2">
            <div className="text-blue-500 text-xs">Preview:</div>
            <SkeletonCard />
            <SkeletonList items={3} />
          </div>
        </div>
      )}

      {toolName !== "generateDraft" && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          <span className="text-blue-500 text-xs">Processing request...</span>
        </div>
      )}
    </div>
  );
}
