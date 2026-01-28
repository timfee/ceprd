"use client";

import { type UIToolInvocation, DefaultChatTransport } from "ai";

import { useChat } from "@ai-sdk/react";
import { Check, CheckCircle2, Loader2, Send, Sparkles, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  type Actor,
  type Goal,
  type PRD,
  type Requirement,
} from "@/lib/schemas";
import { applyAiResponse, validateAiResponse } from "@/lib/ai-apply";
import { type AIResponse } from "@/lib/ai-contract";
import { type DraftStructure, type ProposedChange } from "@/lib/types";
import { buildContextPack } from "@/lib/knowledge";
import { getFocusMeta } from "@/lib/focus";

import { performCompetitiveResearch } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ToolProgress } from "@/components/copilot/tool-progress";
import { FocusBadge } from "@/components/focus-badge";
import { type PRDState, usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type ExtendedToolInvocation = UIToolInvocation<{
  input: unknown;
  output: unknown;
}> & { toolName: string };

function useToolProgress(toolName: string, state: string) {
  const [progressInfo, setProgressInfo] = useState({
    message: "Initializing...",
    step: 0,
  });

  useEffect(() => {
    if (
      toolName === "generateDraft" &&
      (state === "input-available" || state === "input-streaming")
    ) {
      const timers: NodeJS.Timeout[] = [
        setTimeout(
          () => setProgressInfo({ message: "Analyzing...", step: 1 }),
          1000
        ),
        setTimeout(
          () => setProgressInfo({ message: "Drafting...", step: 3 }),
          3000
        ),
        setTimeout(
          () => setProgressInfo({ message: "Refining...", step: 5 }),
          6000
        ),
      ];
      return () => {
        for (const t of timers) {
          clearTimeout(t);
        }
      };
    }
  }, [toolName, state]);

  return progressInfo;
}

// Helper to update store from draft structure
async function applyDraftStructure(
  structure: DraftStructure,
  actions: PRDState["actions"]
) {
  try {
    actions.updateTitle(structure.title);
    actions.updateTLDR(structure.tldr);
    actions.updateBackground(structure.background);

    for (const actor of structure.suggestedActors || []) {
      actions.addActor({
        description: "",
        name: actor.name,
        priority: actor.priority,
        role: actor.role,
      });
    }
    for (const term of structure.suggestedTerms || []) {
      actions.addTerm({ ...term, bannedSynonyms: [] });
    }
    for (const goal of structure.suggestedGoals || []) {
      actions.addGoal({ ...goal, metrics: [] });
    }
    for (const req of structure.suggestedRequirements || []) {
      actions.addRequirement({
        ...req,
        primaryActorId: "",
        relatedGoalIds: [],
        secondaryActorIds: [],
        status: "Draft",
      });
    }
    for (const m of structure.suggestedMilestones || []) {
      actions.addMilestone({
        ...m,
        exitCriteria: [],
        includedRequirementIds: [],
      });
    }

    actions.setAppStatus("ready");

    const results = await performCompetitiveResearch(structure.title);
    const hydrated = results.map((c) => ({
      ...c,
      id: uuidv4(),
      selected: false,
      url: c.url || "",
    }));
    actions.setCompetitors(hydrated);
  } catch (error) {
    console.error("Error processing generateDraft result:", error);
    // Ensure we don't get stuck in initializing
    actions.setAppStatus("ready");
  }
}

function useDraftGeneration(
  toolName: string,
  state: string,
  output: unknown,
  actions: PRDState["actions"]
) {
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current || state !== "output-available") {
      return;
    }

    if (toolName === "generateDraft") {
      const structure = output as DraftStructure;
      if (structure && typeof structure === "object") {
        applyDraftStructure(structure, actions);
      }
      processedRef.current = true;
    }
  }, [toolName, state, output, actions]);
}

interface ProposedChangeCardProps {
  output: ProposedChange;
  toolName: string;
  onApprove: () => void;
  onReject: () => void;
}

interface ProposedBatchCardProps {
  output: AIResponse;
  onApprove: () => void;
  onReject: () => void;
}

const ProposedChangeCard = memo(
  ({ output, toolName, onApprove, onReject }: ProposedChangeCardProps) => (
    <Card className="my-2 w-full overflow-hidden border-ai-border bg-card shadow-none">
      <div className="border-b border-ai-border bg-ai-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[10px] uppercase tracking-wider text-ai">
            Proposed Change
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {toolName}
          </span>
        </div>
      </div>
      <div className="space-y-2 p-4 text-sm">
        {output.title && (
          <div className="font-medium text-foreground">{output.title}</div>
        )}
        {output.description && (
          <div className="text-xs leading-relaxed text-muted-foreground">
            {output.description}
          </div>
        )}
        {output.problem && (
          <div className="text-xs">
            <span className="font-semibold">Problem: </span>
            {output.problem}
          </div>
        )}
        {output.solution && (
          <div className="text-xs">
            <span className="font-semibold">Solution: </span>
            {output.solution}
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-ai-border p-2">
        <Button
          className="h-7 flex-1 text-xs"
          onClick={onReject}
          variant="ghost"
        >
          Reject
        </Button>
        <Button
          className="h-7 flex-1 bg-ai text-ai-foreground hover:bg-ai/90 text-xs"
          onClick={onApprove}
          size="sm"
        >
          <Check className="mr-1 h-3 w-3" />
          Approve
        </Button>
      </div>
    </Card>
  )
);

ProposedChangeCard.displayName = "ProposedChangeCard";

const ProposedBatchCard = memo(
  ({ output, onApprove, onReject }: ProposedBatchCardProps) => (
    <Card className="my-2 w-full overflow-hidden border-ai-border bg-card shadow-none">
      <div className="border-b border-ai-border bg-ai-muted/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[10px] uppercase tracking-wider text-ai">
            Proposed Changes
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            proposeChanges
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4 text-sm">
        <div className="text-xs leading-relaxed text-muted-foreground">
          {output.narrative}
        </div>
        <div className="text-xs text-muted-foreground">
          Changes: {output.changes.length} · New nodes: {output.newNodes.length}
        </div>
      </div>
      <div className="flex gap-2 border-t border-ai-border p-2">
        <Button
          className="h-7 flex-1 text-xs"
          onClick={onReject}
          variant="ghost"
        >
          Reject
        </Button>
        <Button
          className="h-7 flex-1 bg-ai text-ai-foreground hover:bg-ai/90 text-xs"
          onClick={onApprove}
          size="sm"
        >
          <Check className="mr-1 h-3 w-3" />
          Apply
        </Button>
      </div>
    </Card>
  )
);

ProposedBatchCard.displayName = "ProposedBatchCard";

// Separate component to handle the side-effect of updating the store
const ToolHandler = memo(
  ({ toolInvocation }: { toolInvocation: ExtendedToolInvocation }) => {
    const actions = usePRDStore((state) => state.actions);
    const prd = usePRDStore((state) => state.prd);
    const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
      "pending"
    );
    const [applySummary, setApplySummary] = useState<string | null>(null);
    const [applyErrors, setApplyErrors] = useState<string[]>([]);

    const progressInfo = useToolProgress(
      toolInvocation.toolName,
      toolInvocation.state
    );

    useDraftGeneration(
      toolInvocation.toolName,
      toolInvocation.state,
      toolInvocation.output,
      actions
    );

    const handleBatchApprove = useCallback(() => {
      const result = applyAiResponse(toolInvocation.output, actions, prd);
      const summary = `Applied ${result.applied} change${
        result.applied === 1 ? "" : "s"
      }.${result.errors.length > 0 ? ` Skipped ${result.errors.length}.` : ""}`;
      setApplySummary(summary.trim());
      setApplyErrors(result.errors);
      actions.clearActiveFocus();
      setStatus("approved");
    }, [actions, prd, toolInvocation.output]);

    const handleApprove = useCallback(() => {
      if (toolInvocation.state !== "output-available") {
        return;
      }

      const output = toolInvocation.output as ProposedChange;

      try {
        if (toolInvocation.toolName === "addRequirement") {
          const req = output as unknown as Omit<Requirement, "id">;
          actions.addRequirement({
            ...req,
            primaryActorId: "",
            relatedGoalIds: [],
            secondaryActorIds: [],
            status: "Draft",
          });
        } else if (toolInvocation.toolName === "addGoal") {
          const goal = output as unknown as Omit<Goal, "id">;
          actions.addGoal({ ...goal, metrics: [] });
        } else if (toolInvocation.toolName === "addActor") {
          const actor = output as unknown as Omit<Actor, "id">;
          actions.addActor(actor);
        } else if (toolInvocation.toolName === "updateTLDR") {
          const tldr = output as unknown as Partial<PRD["sections"]["tldr"]>;
          actions.updateTLDR(tldr);
        }
        actions.clearActiveFocus();
        setStatus("approved");
      } catch (error) {
        console.error("Failed to apply change:", error);
      }
    }, [
      toolInvocation.state,
      toolInvocation.output,
      toolInvocation.toolName,
      actions,
    ]);

    const handleReject = useCallback(() => {
      setStatus("rejected");
    }, []);

    // Render Logic
    if (toolInvocation.toolName === "generateDraft") {
      return (
        <ToolProgress
          currentStep={progressInfo.step}
          message={progressInfo.message}
          state={toolInvocation.state}
          toolName={toolInvocation.toolName}
        />
      );
    }

    if (
      [
        "addRequirement",
        "addGoal",
        "addActor",
        "updateTLDR",
        "proposeChanges",
      ].includes(toolInvocation.toolName)
    ) {
      if (toolInvocation.state !== "output-available") {
        return (
          <Card className="border-ai-border bg-ai-muted/50 p-3 shadow-none">
            <div className="flex items-center gap-2 text-xs text-ai">
              <Loader2 className="h-3 w-3 animate-spin" />
              Preparing proposal...
            </div>
          </Card>
        );
      }

      if (toolInvocation.toolName === "proposeChanges") {
        const { errors, response } = validateAiResponse(toolInvocation.output);
        if (!response) {
          return (
            <Card className="border-ai-border bg-ai-muted/50 p-3 shadow-none">
              <div className="text-xs text-ai">
                Invalid proposal: {errors.join(" · ")}
              </div>
            </Card>
          );
        }

        if (status === "approved") {
          return (
            <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                {applySummary || "Changes applied."}
              </div>
              {applyErrors.length > 0 ? (
                <div className="space-y-1 rounded-md border border-green-200/60 bg-white/60 p-2 text-[11px] text-green-700 dark:border-green-900/60 dark:bg-green-900/20 dark:text-green-200">
                  <div className="font-semibold">Skipped</div>
                  {applyErrors.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }

        if (status === "rejected") {
          return (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
              <X className="h-3 w-3" />
              Changes rejected.
            </div>
          );
        }

        return (
          <ProposedBatchCard
            onApprove={handleBatchApprove}
            onReject={handleReject}
            output={response}
          />
        );
      }

      const output = toolInvocation.output as ProposedChange;

      if (status === "approved") {
        return (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Change applied.
          </div>
        );
      }

      if (status === "rejected") {
        return (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            <X className="h-3 w-3" />
            Change rejected.
          </div>
        );
      }

      return (
        <ProposedChangeCard
          onApprove={handleApprove}
          onReject={handleReject}
          output={output}
          toolName={toolInvocation.toolName}
        />
      );
    }

    return null;
  }
);

ToolHandler.displayName = "ToolHandler";

export function CopilotSidebar() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const setAppStatus = usePRDStore((state) => state.actions.setAppStatus);
  const appStatus = usePRDStore((state) => state.appStatus);
  const activeNodeIds = usePRDStore((state) => state.activeNodeIds);
  const activeSection = usePRDStore((state) => state.activeSection);
  const focusMode = usePRDStore((state) => state.focusMode);
  const prd = usePRDStore((state) => state.prd);
  const { clearActiveFocus, setFocusMode } = usePRDStore(
    (state) => state.actions
  );

  const [input, setInput] = useState("");
  const [showFocusHelp, setShowFocusHelp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const activeSectionLabel =
    {
      actors: "Actors",
      background: "Background",
      competitors: "Market Research",
      copilot: "Copilot",
      glossary: "Glossary",
      goals: "Goals",
      milestones: "Milestones",
      requirements: "Requirements",
      tldr: "TL;DR",
    }[activeSection] ?? "TL;DR";

  const focusMeta = useMemo(
    () => getFocusMeta(prd, activeNodeIds),
    [activeNodeIds, prd]
  );

  const handleFocusOn = useCallback(() => {
    setFocusMode(true);
  }, [setFocusMode]);

  const handleFocusOff = useCallback(() => {
    setFocusMode(false);
  }, [setFocusMode]);

  const handleClearFocus = useCallback(() => {
    clearActiveFocus();
  }, [clearActiveFocus]);

  const handleToggleFocusHelp = useCallback(() => {
    setShowFocusHelp((prev) => !prev);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && appStatus === "idle") {
      setAppStatus("initializing");
    }
  }, [messages, appStatus, setAppStatus]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && focusMode && activeNodeIds.length > 0) {
        clearActiveFocus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNodeIds.length, clearActiveFocus, focusMode]);

  // Safety: If AI finishes without calling generateDraft, unlock the app
  useEffect(() => {
    const isLoading = status === "streaming" || status === "submitted";
    if (appStatus === "initializing" && !isLoading && messages.length > 0) {
      const hasDraftTool = messages.some((m) =>
        m.parts?.some((p) => p.type === "tool-generateDraft")
      );

      if (!hasDraftTool) {
        setAppStatus("ready");
      }
    }
  }, [appStatus, messages, setAppStatus, status]);

  useEffect(() => {
    const messageCount = messages.length;
    if (messageCount > 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSend = useCallback(
    async (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!input?.trim()) {
        return;
      }
      const userMessage = input;
      setInput("");
      const contextPack = buildContextPack(prd, {
        nodeIds: focusMode ? activeNodeIds : [],
        section: activeSection,
      });
      await sendMessage({ text: userMessage }, { body: { contextPack } });
    },
    [activeNodeIds, activeSection, focusMode, input, prd, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const focusBadge = useMemo(() => {
    if (!focusMode) {
      return (
        <FocusBadge label="Focus: Off" onClear={handleClearFocus} subdued />
      );
    }

    if (!focusMeta) {
      return (
        <FocusBadge label="Focus: None" onClear={handleClearFocus} subdued />
      );
    }

    return (
      <FocusBadge
        kind={focusMeta.kind}
        label={focusMeta.label}
        onClear={handleClearFocus}
      />
    );
  }, [focusMeta, focusMode, handleClearFocus]);

  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <div className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ai-muted">
          <Sparkles className="h-4 w-4 text-ai" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">AI Copilot</span>
          <span className="text-xs text-muted-foreground">
            Always here to help
          </span>
          <span className="text-[11px] text-muted-foreground">
            Focus Mode uses selected items as context.
          </span>
        </div>
        <div className="ml-auto rounded-full border border-ai-border bg-ai-muted/40 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-ai">
          Context: {activeSectionLabel}
        </div>
        {focusBadge}
      </div>
      <div className="border-b border-border bg-background px-4 pb-3">
        <div className="rounded-lg border border-ai-border bg-ai-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ai">
                Spotlight Focus
              </div>
              <div>
                Spotlight pins selected items as context for the Copilot.
              </div>
              <Button
                className="h-auto px-0 text-[11px] text-ai"
                onClick={handleToggleFocusHelp}
                size="sm"
                variant="ghost"
              >
                {showFocusHelp ? "Hide details" : "What does this change?"}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="h-7 px-2 text-[11px]"
                onClick={handleFocusOn}
                size="sm"
                variant={focusMode ? "default" : "outline"}
              >
                Use Spotlight
              </Button>
              <Button
                className="h-7 px-2 text-[11px]"
                onClick={handleFocusOff}
                size="sm"
                variant={focusMode ? "outline" : "default"}
              >
                Ignore Focus
              </Button>
              <Button
                className="h-7 px-2 text-[11px]"
                disabled={!focusMode || activeNodeIds.length === 0}
                onClick={handleClearFocus}
                size="sm"
                variant="ghost"
              >
                Clear
              </Button>
            </div>
          </div>
          {showFocusHelp ? (
            <div className="mt-3 rounded-md border border-ai-border/60 bg-background/60 p-2 text-[11px] text-muted-foreground">
              <div>
                • Spotlight On: responses anchor to focused items first.
              </div>
              <div>• Spotlight Off: responses use the active section only.</div>
              <div>• Clear removes all focused items.</div>
            </div>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-4">
          {messages.map((m) => (
            <div
              className={`flex flex-col gap-2 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
              key={m.id}
            >
              <div className="flex max-w-full items-start gap-3">
                {m.role === "assistant" && (
                  <Avatar className="mt-1 h-8 w-8">
                    <div className="flex h-full w-full items-center justify-center bg-ai-muted">
                      <Sparkles className="h-4 w-4 text-ai" />
                    </div>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-2",
                    m.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {m.parts?.map((part) =>
                    part.type === "text" ? (
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          m.role === "user"
                            ? "rounded-tr-none bg-primary text-primary-foreground"
                            : "bg-transparent p-0 text-foreground"
                        )}
                        key={`${m.id}-${part.type}-${part.text.slice(0, 12)}`}
                      >
                        {part.text}
                      </div>
                    ) : null
                  )}

                  {m.parts
                    ?.filter((part) => part.type.startsWith("tool-"))
                    .map((part) => {
                      const toolName = part.type.replace("tool-", "");
                      const invocation: ExtendedToolInvocation = {
                        ...part,
                        toolName,
                      } as unknown as ExtendedToolInvocation;

                      return (
                        <div
                          className="w-full max-w-sm"
                          key={invocation.toolCallId}
                        >
                          <ToolHandler toolInvocation={invocation} />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form className="border-t border-border bg-background p-4" ref={formRef}>
        <div className="flex gap-2">
          <Textarea
            className="min-h-[60px] resize-none bg-muted/30 text-sm leading-relaxed transition-colors focus:bg-background"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to update the PRD or refine requirements..."
            value={input || ""}
          />
          <Button
            className="h-[60px] w-[60px] flex-shrink-0"
            disabled={!input.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
