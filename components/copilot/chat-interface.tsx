"use client";

import { type UIToolInvocation } from "ai";

import { useChat } from "@ai-sdk/react";
import { Check, CheckCircle2, Loader2, Send, Sparkles, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  type Actor,
  type Goal,
  type PRD,
  type Requirement,
} from "@/lib/schemas";
import { type DraftStructure, type ProposedChange } from "@/lib/types";

import { performCompetitiveResearch } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ToolProgress } from "@/components/copilot/tool-progress";
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

    // Trigger research side-effect
    console.log("Triggering performCompetitiveResearch for:", structure.title);
    const results = await performCompetitiveResearch(structure.title);
    console.log("Competitive research results received:", results.length);
    const hydrated = results.map((c) => ({
      ...c,
      id: uuidv4(),
      selected: false,
      url: c.url || "",
    }));
    actions.setCompetitors(hydrated);
  } catch (error) {
    console.error("Error processing generateDraft result:", error);
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

// Separate component to handle the side-effect of updating the store
const ToolHandler = memo(
  ({ toolInvocation }: { toolInvocation: ExtendedToolInvocation }) => {
    const actions = usePRDStore((state) => state.actions);
    const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
      "pending"
    );

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
      ["addRequirement", "addGoal", "addActor", "updateTLDR"].includes(
        toolInvocation.toolName
      )
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
  const { messages, sendMessage } = useChat();
  const setHasChatStarted = usePRDStore(
    (state) => state.actions.setHasChatStarted
  );
  const hasChatStarted = usePRDStore((state) => state.hasChatStarted);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (messages.length > 0 && !hasChatStarted) {
      setHasChatStarted(true);
    }
  }, [messages, hasChatStarted, setHasChatStarted]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      await sendMessage({ text: userMessage });
    },
    [input, sendMessage]
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
                  {m.parts?.map((part, i) =>
                    part.type === "text" ? (
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          m.role === "user"
                            ? "rounded-tr-none bg-primary text-primary-foreground"
                            : "bg-transparent p-0 text-foreground"
                        )}
                        key={i + part.text.slice(0, 5)}
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
