"use client";

import {
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { generateSectionContent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BackgroundSelector } from "./background-selector";
import { CompetitorAnalysis } from "./competitor-analysis";
import { GoalList } from "./goal-list";
import { PRDHeader } from "./header";
import { IdeaDumpDialog } from "./idea-dump-dialog";
import { MilestoneList } from "./milestone-list";
import { RequirementList } from "./requirement-list";

/**
 * The main PRD editing interface, organizing sections into tabs.
 */
export function PRDEditor() {
  const { tldr, background } = usePRDStore((state) => state.prd.sections);
  const { actors } = usePRDStore((state) => state.prd.context);
  const { title } = usePRDStore((state) => state.prd.meta);
  const hasChatStarted = usePRDStore((state) => state.hasChatStarted);
  const { updateTLDR, updateBackground } = usePRDStore(
    (state) => state.actions
  );

  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerate = async (
    section: "tldr" | "background" | "tldr:problem" | "tldr:solution"
  ) => {
    setIsGenerating(section);
    try {
      const result = await generateSectionContent(section, {
        title,
        actors,
      });

      if (result.tldr) {
        // Only update fields that were returned
        if (result.tldr.problem) {
          updateTLDR({ problem: result.tldr.problem });
        }
        if (result.tldr.solution) {
          updateTLDR({ solution: result.tldr.solution });
        }
      } else if (section === "background" && result.background) {
        updateBackground(result.background);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      <IdeaDumpDialog />

      <div
        className={cn(
          "flex h-full flex-1 flex-col overflow-hidden transition-all duration-500",
          !hasChatStarted && "blur-sm opacity-10 pointer-events-none"
        )}
      >
        <PRDHeader />

        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-4xl space-y-8 pb-24">
            <Tabs className="w-full" defaultValue="tldr">
              <TabsList className="mb-8">
                <TabsTrigger value="tldr">TL;DR</TabsTrigger>
                <TabsTrigger value="background">Background</TabsTrigger>
                <TabsTrigger value="research">Market Research</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
              </TabsList>

              {/* TLDR SECTION */}
              <TabsContent className="space-y-6" value="tldr">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-lg">
                      Core Problem
                    </CardTitle>
                    <Button
                      disabled={!!isGenerating}
                      onClick={() => handleGenerate("tldr:problem")}
                      size="sm"
                      variant="outline"
                    >
                      {isGenerating === "tldr:problem" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                      )}
                      Generate
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      className="min-h-[100px] text-base"
                      onChange={(e) => updateTLDR({ problem: e.target.value })}
                      placeholder="What is the single biggest blocker?"
                      value={tldr.problem}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-lg">
                      Proposed Solution
                    </CardTitle>
                    <Button
                      disabled={!!isGenerating}
                      onClick={() => handleGenerate("tldr:solution")}
                      size="sm"
                      variant="outline"
                    >
                      {isGenerating === "tldr:solution" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                      )}
                      Generate
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      className="min-h-[100px] text-base"
                      onChange={(e) => updateTLDR({ solution: e.target.value })}
                      placeholder="High-level summary of the fix."
                      value={tldr.solution}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BACKGROUND SECTION */}
              <TabsContent className="space-y-6" value="background">
                <div className="flex flex-col gap-6 lg:h-[600px] lg:flex-row">
                  {/* Left: Narrative Context */}
                  <Card className="flex h-full flex-1 flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="font-medium text-lg">
                        Narrative Context
                      </CardTitle>
                      <Button
                        disabled={!!isGenerating}
                        onClick={() => handleGenerate("background")}
                        size="sm"
                        variant="outline"
                      >
                        {isGenerating === "background" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                        )}
                        Generate Narrative
                      </Button>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1">
                      <Textarea
                        className="h-full min-h-[300px] resize-none p-4 text-base leading-relaxed"
                        onChange={(e) =>
                          updateBackground({ context: e.target.value })
                        }
                        placeholder="Tell the story: Why are we building this now? What happens if we don't?"
                        value={background.context}
                      />
                    </CardContent>
                  </Card>

                  {/* Right: Strategic Drivers Cockpit */}
                  <div className="h-full w-full shrink-0 lg:w-[350px]">
                    <BackgroundSelector />
                  </div>
                </div>
              </TabsContent>

              {/* RESEARCH SECTION */}
              <TabsContent value="research">
                <CompetitorAnalysis />
              </TabsContent>

              {/* GOALS SECTION */}
              <TabsContent value="goals">
                <GoalList />
              </TabsContent>

              {/* REQUIREMENTS SECTION */}
              <TabsContent value="requirements">
                <RequirementList />
              </TabsContent>

              {/* MILESTONES SECTION */}
              <TabsContent value="milestones">
                <MilestoneList />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {!hasChatStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-semibold text-2xl">
              Let&apos;s build your PRD
            </h2>
            <p className="text-muted-foreground">
              Start by chatting with the Copilot on the right. Describe your idea,
              and we&apos;ll generate the structure for you.
            </p>
            <div className="flex items-center gap-2 font-medium text-primary text-sm animate-pulse">
              Go to Chat <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
