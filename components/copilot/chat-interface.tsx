"use client";

import { useChat } from "@ai-sdk/react";
import type { UIToolInvocation } from "ai";
import { Bot, Check, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
import type { Actor, Goal, PRD, Requirement } from "@/lib/schemas";
import { type PRDState, usePRDStore } from "@/lib/store";
import type {
  CompetitiveAnalysisResult,
  DraftStructure,
  ProposedChange,
} from "@/lib/types";

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input?.trim()) {
      return;
    }
    const userMessage = input;
    setInput("");
    await sendMessage({ text: userMessage });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

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
                part.type === "text" ? <span key={i}>{part.text}</span> : null
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

type ExtendedToolInvocation = UIToolInvocation<{
  input: unknown;
  output: unknown;
}> & { toolName: string };

function useToolProgress(toolName: string, state: string) {
  const [progressInfo, setProgressInfo] = useState({
    step: 0,
    message: "Initializing...",
    timestamp: Date.now(),
  });

  useEffect(() => {
    if (
      toolName === "generateDraft" &&
      (state === "input-available" || state === "input-streaming")
    ) {
      const progressSteps = [
        { step: 0, message: "Analyzing product idea...", delay: 1000 },
        { step: 1, message: "Defining project scope", delay: 3000 },
        {
          step: 2,
          message: "Identifying key actors and personas",
          delay: 5000,
        },
        { step: 3, message: "Generating functional requirements", delay: 8000 },
        { step: 4, message: "Creating project milestones", delay: 12_000 },
        { step: 5, message: "Setting up terminology glossary", delay: 15_000 },
      ];

      const timers: NodeJS.Timeout[] = [];
      for (const { step, message, delay } of progressSteps) {
        const timer = setTimeout(() => {
          setProgressInfo({ step, message, timestamp: Date.now() });
        }, delay);
        timers.push(timer);
      }
      return () => timers.forEach(clearTimeout);
    }
  }, [toolName, state]);

  useEffect(() => {
    if (toolName === "generateDraft" && state === "output-available") {
      setProgressInfo({
        step: 6,
        message: "Draft generation completed!",
        timestamp: Date.now(),
      });
    }
  }, [toolName, state]);

  return progressInfo;
}

// Helper to update store from draft structure
function applyDraftStructure(
  structure: DraftStructure,
  actions: PRDState["actions"]
) {
  try {
    actions.updateTitle(structure.title);
    actions.updateTLDR(structure.tldr);
    actions.updateBackground(structure.background);

    for (const actor of structure.suggestedActors || []) {
      actions.addActor({
        name: actor.name,
        role: actor.role,
        priority: actor.priority,
        description: "",
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
        status: "Draft",
        primaryActorId: "",
        secondaryActorIds: [],
      });
    }
    for (const m of structure.suggestedMilestones || []) {
      actions.addMilestone({
        ...m,
        includedRequirementIds: [],
        exitCriteria: [],
      });
    }

    // Trigger research side-effect
    performCompetitiveResearch(structure.title).then(
      (results: CompetitiveAnalysisResult[]) => {
        const hydrated = results.map((c) => ({
          ...c,
          id: uuidv4(),
          url: c.url || "",
        }));
        actions.setCompetitors(hydrated);
      }
    );
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

// Separate component to handle the side-effect of updating the store
function ToolHandler({
  toolInvocation,
}: {
  toolInvocation: ExtendedToolInvocation;
}) {
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

  // Handle User Approval for Granular Changes
  const handleApprove = () => {
    if (toolInvocation.state !== "output-available") {
      return;
    }

    const output = toolInvocation.output as ProposedChange;

    try {
      if (toolInvocation.toolName === "addRequirement") {
        const req = output as unknown as Omit<Requirement, "id">;
        actions.addRequirement({
          ...req,
          status: "Draft",
          primaryActorId: "",
          secondaryActorIds: [],
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
  };

  const handleReject = () => {
    setStatus("rejected");
  };

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
      <Card className="my-2 w-full max-w-sm overflow-hidden border-purple-200 text-left dark:border-purple-900">
        <CardHeader className="bg-purple-50 px-4 py-3 dark:bg-purple-900/20">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-700 text-xs uppercase tracking-wider dark:text-purple-400">
              Proposed Change
            </span>
            <span className="font-mono text-muted-foreground text-xs">
              {toolInvocation.toolName}
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
            onClick={handleReject}
            variant="ghost"
          >
            Reject
          </Button>
          <Button
            className="h-8 flex-1 bg-purple-600 text-xs hover:bg-purple-700"
            onClick={handleApprove}
            size="sm"
          >
            <Check className="mr-1 h-3 w-3" />
            Approve
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
