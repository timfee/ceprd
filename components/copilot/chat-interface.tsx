"use client";

import { type UIToolInvocation } from "ai";

import { useChat } from "@ai-sdk/react";
import { Bot, Check, Send, X } from "lucide-react";
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
import { ToolProgress } from "@/components/copilot/tool-progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { type PRDState, usePRDStore } from "@/lib/store";

type ExtendedToolInvocation = UIToolInvocation<{
  input: unknown;
  output: unknown;
}> & { toolName: string };

function useToolProgress(toolName: string, state: string) {
  const [progressInfo, setProgressInfo] = useState({
    message: "Initializing...",
    step: 0,
    timestamp: Date.now(),
  });

  useEffect(() => {
    if (
      toolName === "generateDraft" &&
      (state === "input-available" || state === "input-streaming")
    ) {
      const progressSteps = [
        { delay: 1000, message: "Analyzing product idea...", step: 0 },
        { delay: 3000, message: "Defining project scope", step: 1 },
        {
          delay: 5000,
          message: "Identifying key actors and personas",
          step: 2,
        },
        { delay: 8000, message: "Generating functional requirements", step: 3 },
        { delay: 12_000, message: "Creating project milestones", step: 4 },
        { delay: 15_000, message: "Setting up terminology glossary", step: 5 },
      ];

      const timers: NodeJS.Timeout[] = [];
      for (const { step, message, delay } of progressSteps) {
        const timer = setTimeout(() => {
          setProgressInfo({ message, step, timestamp: Date.now() });
        }, delay);
        timers.push(timer);
      }
      return () => {
        for (const t of timers) {
          clearTimeout(t);
        }
      };
    }
  }, [toolName, state]);

  useEffect(() => {
    if (toolName === "generateDraft" && state === "output-available") {
      setProgressInfo({
        message: "Draft generation completed!",
        step: 6,
        timestamp: Date.now(),
      });
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
    const results = await performCompetitiveResearch(structure.title);
    const hydrated = results.map((c) => ({
      ...c,
      id: uuidv4(),
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
    <Card className="my-2 w-full max-w-sm overflow-hidden border-purple-200 text-left dark:border-purple-900">
      <CardHeader className="bg-purple-50 px-4 py-3 dark:bg-purple-900/20">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-purple-700 text-xs uppercase tracking-wider dark:text-purple-400">
            Proposed Change
          </span>
          <span className="font-mono text-muted-foreground text-xs">
            {toolName}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 text-sm">
        {output.title && (
          <div className="font-medium text-foreground">{output.title}</div>
        )}
        {output.description && (
          <div className="text-muted-foreground text-xs leading-relaxed">
            {output.description}
          </div>
        )}
        {output.problem && (
          <div>
            <span className="font-semibold text-xs">Problem: </span>
            {output.problem}
          </div>
        )}
        {output.solution && (
          <div>
            <span className="font-semibold text-xs">Solution: </span>
            {output.solution}
          </div>
        )}
        {output.name && (
          <div className="font-medium text-foreground">{output.name}</div>
        )}
        {output.role && (
          <div className="text-muted-foreground text-xs">
            Role: {output.role}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 border-t p-2">
        <Button
          className="h-8 flex-1 text-xs"
          onClick={onReject}
          variant="ghost"
        >
          Reject
        </Button>
        <Button
          className="h-8 flex-1 bg-purple-600 text-xs hover:bg-purple-700"
          onClick={onApprove}
          size="sm"
        >
          <Check className="mr-1 h-3 w-3" />
          Approve
        </Button>
      </CardFooter>
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

    // Confirmation UI for Structural Changes
    if (
      ["addRequirement", "addGoal", "addActor", "updateTLDR"].includes(
        toolInvocation.toolName
      )
    ) {
      if (toolInvocation.state !== "output-available") {
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 text-muted-foreground text-xs">
            <Bot className="h-3 w-3 animate-pulse" />
            Preparing proposal...
          </div>
        );
      }

      const output = toolInvocation.output as ProposedChange;

      if (status === "approved") {
        return (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 text-green-700 text-xs dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
            <Check className="h-3 w-3" />
            Change approved and applied.
          </div>
        );
      }

      if (status === "rejected") {
        return (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 text-xs dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
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

  // Sync chat state
  useEffect(() => {
    if (messages.length > 0 && !hasChatStarted) {
      setHasChatStarted(true);
    }
  }, [messages, hasChatStarted, setHasChatStarted]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSend = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
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
        // We can't await here directly without making this async, but handleSend handles the async part.
        // We need to prevent default behavior of enter (newline)
        // Note: handleSend prevents default.
        // We just need to trigger the event. But React synthetic events might be tricky.
        // Actually handleSend takes SyntheticEvent and calls preventDefault.
        // We can just call handleSend(e).
        handleSend(e);
      }
    },
    [handleSend]
  );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="p-4">
        <h2 className="flex items-center gap-2 font-semibold text-lg">
          <Bot className="h-5 w-5 text-purple-600" />
          Copilot
        </h2>
        <p className="text-muted-foreground text-xs">Chat to build your PRD.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={scrollRef}>
        {messages.map((m) => (
          <div
            className={`flex flex-col gap-2 ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
            key={m.id}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-3 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.parts?.map((part, i) =>
                // biome-ignore lint/suspicious/noArrayIndexKey: parts do not have unique IDs
                part.type === "text" ? (
                  <span key={i + part.text.slice(0, 5)}>{part.text}</span>
                ) : null
              )}
            </div>

            {/* Render Tool Invocations as System Activities */}
            {m.parts
              ?.filter((part) => part.type.startsWith("tool-"))
              .map((part) => {
                const toolName = part.type.replace("tool-", "");
                // Construct a typed invocation object
                const invocation: ExtendedToolInvocation = {
                  ...part,
                  toolName,
                } as unknown as ExtendedToolInvocation;

                return (
                  <ToolHandler
                    key={invocation.toolCallId}
                    toolInvocation={invocation}
                  />
                );
              })}
          </div>
        ))}
      </div>

      <form className="flex gap-2 p-4" ref={formRef}>
        <Textarea
          className="min-h-[44px] flex-1 resize-none rounded-xl"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to update the PRD or refine requirements..."
          value={input || ""}
        />
        <Button
          className="h-[44px] w-[44px] rounded-xl"
          onClick={handleSend}
          size="icon"
          type="button"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
