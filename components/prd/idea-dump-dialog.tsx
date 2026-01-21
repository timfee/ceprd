"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  generateIdeaDumpStructure,
  performCompetitiveResearch,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";

/**
 * Dialog for capturing raw ideas and converting them into a structured PRD.
 */
export function IdeaDumpDialog() {
  const {
    updateTitle,
    updateTLDR,
    updateBackground,
    addActor,
    addTerm,
    addGoal,
    addMilestone,
    addRequirement,
    setCompetitors,
  } = usePRDStore((state) => state.actions);

  const [isOpen, setIsOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("Structuring...");

  const handleGenerate = async () => {
    if (!idea.trim()) {
      return;
    }
    setIsGenerating(true);
    setLoadingText("Analyzing Structure...");

    try {
      const structure = await generateIdeaDumpStructure(idea);

      updateTitle(structure.title);
      updateTLDR({
        problem: structure.tldr.problem,
        solution: structure.tldr.solution,
        valueProps: structure.tldr.valueProps,
      });

      updateBackground(structure.background);

      const actorMap = new Map<string, string>();

      for (const actor of structure.suggestedActors) {
        const actorId = uuidv4();
        actorMap.set(actor.name, actorId);

        addActor({
          id: actorId,
          name: actor.name,
          role: actor.role,
          priority: actor.priority,
          description: "",
        });
      }

      for (const term of structure.suggestedTerms) {
        addTerm({
          term: term.term,
          definition: term.definition,
          bannedSynonyms: [],
        });
      }

      for (const goal of structure.suggestedGoals) {
        addGoal({
          title: goal.title,
          description: goal.description,
          priority: goal.priority,
          metrics: [],
        });
      }

      for (const req of structure.suggestedRequirements) {
        let actorId = "";
        if (req.primaryActorName) {
          actorId = actorMap.get(req.primaryActorName) || "";
        }

        addRequirement({
          title: req.title,
          description: req.description,
          priority: req.priority,
          type: req.type,
          status: "Draft",
          primaryActorId: actorId,
          secondaryActorIds: [],
        });
      }

      for (const milestone of structure.suggestedMilestones) {
        addMilestone({
          title: milestone.title,
          targetDate: milestone.targetDate,
          includedRequirementIds: [],
          exitCriteria: [],
        });
      }

      // 2. Kick off Market Research
      setLoadingText("Researching Competitors...");
      const researchResults = await performCompetitiveResearch(structure.title);

      const hydratedCompetitors = researchResults.map((c) => ({
        ...c,
        id: uuidv4(),
        url: c.url || "",
      }));
      setCompetitors(hydratedCompetitors);

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to process idea:", error);
    } finally {
      setIsGenerating(false);
      setLoadingText("Structuring...");
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start with an Idea</DialogTitle>
          <DialogDescription>
            Dump your raw thoughts here. AI will structure them into a draft PRD
            with personas, problem statement, and initial market research.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Textarea
            className="min-h-[200px] text-base"
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. I want to build a secure file sharing feature for Chrome Enterprise that prevents data exfiltration..."
            value={idea}
          />
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="ghost">
            Skip to Editor
          </Button>
          <Button
            disabled={isGenerating || !idea.trim()}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingText}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate Draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
