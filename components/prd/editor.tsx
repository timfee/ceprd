"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  MoreVertical,
  PlusCircle,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { generateSectionContent } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";

import { CompetitorAnalysis } from "./competitor-analysis";
import { GoalList } from "./goal-list";
import { IdeaDumpDialog } from "./idea-dump-dialog";
import { MilestoneList } from "./milestone-list";
import { NarrativeBuilder } from "./narrative-builder";
import { RequirementList } from "./requirement-list";

interface RefineDropdownProps {
  section: "tldr:problem" | "tldr:solution" | "background";
  isGenerating: string | null;
  onGenerate: (
    section: "tldr:problem" | "tldr:solution" | "background",
    instruction: "Make longer" | "Make shorter" | "Rewrite" | "Remove AI Slop"
  ) => void;
}

const RefineDropdown = memo(
  ({ section, isGenerating, onGenerate }: RefineDropdownProps) => {
    const handleMakeLonger = useCallback(
      () => onGenerate(section, "Make longer"),
      [onGenerate, section]
    );
    const handleMakeShorter = useCallback(
      () => onGenerate(section, "Make shorter"),
      [onGenerate, section]
    );
    const handleRewrite = useCallback(
      () => onGenerate(section, "Rewrite"),
      [onGenerate, section]
    );
    const handleHumanize = useCallback(
      () => onGenerate(section, "Remove AI Slop"),
      [onGenerate, section]
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-7 gap-1.5 text-xs text-ai"
            disabled={!!isGenerating}
            size="sm"
            variant="ghost"
          >
            {isGenerating === section ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Refine
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleMakeLonger}>
            <Maximize2 className="mr-2 h-3 w-3" />
            Make longer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMakeShorter}>
            <Minimize2 className="mr-2 h-3 w-3" />
            Make shorter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRewrite}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Rewrite
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleHumanize}>
            <Wand2 className="mr-2 h-3 w-3" />
            Remove AI Slop
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
RefineDropdown.displayName = "RefineDropdown";

export function PRDEditor() {
  const { tldr } = usePRDStore((state) => state.prd.sections);
  const { actors } = usePRDStore((state) => state.prd.context);
  const { title, status } = usePRDStore((state) => state.prd.meta);
  const prdData = usePRDStore((state) => state.prd);
  const { updateTLDR, updateTitle, updateBackground } = usePRDStore(
    (state) => state.actions
  );

  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [ideaDumpOpen, setIdeaDumpOpen] = useState(false);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    const container = tabsScrollRef.current;
    if (!container) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 10);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const container = tabsScrollRef.current;
    if (!container) {
      return;
    }

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = useCallback((direction: "left" | "right") => {
    const container = tabsScrollRef.current;
    if (!container) {
      return;
    }

    const scrollAmount = 200;
    container.scrollBy({
      behavior: "smooth",
      left: direction === "left" ? -scrollAmount : scrollAmount,
    });
  }, []);

  const handleScrollLeft = useCallback(() => scroll("left"), [scroll]);
  const handleScrollRight = useCallback(() => scroll("right"), [scroll]);

  const handleGenerate = useCallback(
    async (
      section: "tldr" | "background" | "tldr:problem" | "tldr:solution",
      instruction?:
        | "Make longer"
        | "Make shorter"
        | "Rewrite"
        | "Remove AI Slop"
    ) => {
      setIsGenerating(section);
      try {
        const result = await generateSectionContent(
          section,
          {
            actors,
            title,
          },
          instruction
        );

        if (result.tldr) {
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
    },
    [actors, title, updateTLDR, updateBackground]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => updateTitle(e.target.value),
    [updateTitle]
  );
  const handleProblemChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      updateTLDR({ problem: e.target.value }),
    [updateTLDR]
  );
  const handleSolutionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      updateTLDR({ solution: e.target.value }),
    [updateTLDR]
  );

  const handleSaveLocal = useCallback(() => {
    localStorage.setItem("prd-draft", JSON.stringify(prdData));
    toast.success("Saved to local storage");
  }, [prdData]);

  const handleExportJSON = useCallback(() => {
    const dataStr = JSON.stringify(prdData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replaceAll(/\s+/g, "_") || "untitled_prd"}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    toast.success("Exported JSON");
  }, [prdData, title]);

  const openIdeaDump = useCallback(() => setIdeaDumpOpen(true), []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <IdeaDumpDialog onOpenChange={setIdeaDumpOpen} open={ideaDumpOpen} />

      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-1 items-center gap-2">
          <Input
            className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0 md:text-base"
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            value={title}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className="ml-2 cursor-pointer font-normal text-muted-foreground hover:bg-muted"
                variant="outline"
              >
                {status} <MoreVertical className="ml-1 h-3 w-3" />
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem disabled>Change Status</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Draft</DropdownMenuItem>
              <DropdownMenuItem>In Review</DropdownMenuItem>
              <DropdownMenuItem>Approved</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="h-8 gap-1.5"
            onClick={openIdeaDump}
            size="sm"
            variant="outline"
          >
            <PlusCircle className="h-4 w-4" />
            New Draft
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 gap-1.5" size="sm">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSaveLocal}>
                <Save className="mr-2 h-4 w-4" /> Save to Browser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download className="mr-2 h-4 w-4" /> Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Tabs
        className="flex flex-1 flex-col overflow-hidden"
        defaultValue="tldr"
      >
        <div className="relative border-b border-border bg-background px-6">
          {/* Left Fade/Scroll Button */}
          {showLeftScroll && (
            <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 flex w-16 items-center bg-gradient-to-r from-background via-background to-transparent">
              <Button
                className="pointer-events-auto ml-1 h-8 w-8"
                onClick={handleScrollLeft}
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div
            className="scrollbar-hide overflow-x-auto pb-px"
            ref={tabsScrollRef}
            style={{
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <TabsList className="inline-flex h-10 w-auto justify-start gap-1 rounded-none border-0 bg-transparent p-0">
              {[
                "TL;DR",
                "Market Research",
                "Background",
                "Requirements",
                "Goals",
                "Milestones",
              ].map((tab) => {
                const val = tab
                  .toLowerCase()
                  .replace(";", "")
                  .replace(" ", "-");
                // Specific mapping for tldr
                const value = tab === "TL;DR" ? "tldr" : val;

                return (
                  <TabsTrigger
                    className="h-10 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                    key={value}
                    value={value}
                  >
                    {tab}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Right Fade/Scroll Button */}
          {showRightScroll && (
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 flex w-16 items-center justify-end bg-gradient-to-l from-background via-background to-transparent">
              <Button
                className="pointer-events-auto mr-1 h-8 w-8"
                onClick={handleScrollRight}
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl p-8 pb-24">
            <TabsContent className="mt-0 space-y-8" value="tldr">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Core Problem</h3>
                  <RefineDropdown
                    isGenerating={isGenerating}
                    onGenerate={handleGenerate}
                    section="tldr:problem"
                  />
                </div>
                <Textarea
                  className="min-h-[120px] resize-none text-sm leading-relaxed"
                  onChange={handleProblemChange}
                  placeholder="What is the single biggest blocker?"
                  value={tldr.problem}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Proposed Solution</h3>
                  <RefineDropdown
                    isGenerating={isGenerating}
                    onGenerate={handleGenerate}
                    section="tldr:solution"
                  />
                </div>
                <Textarea
                  className="min-h-[120px] resize-none text-sm leading-relaxed"
                  onChange={handleSolutionChange}
                  placeholder="High-level summary of the fix."
                  value={tldr.solution}
                />
              </div>
            </TabsContent>

            <TabsContent className="mt-0" value="market-research">
              <CompetitorAnalysis problem={tldr.problem} title={title} />
            </TabsContent>

            <TabsContent className="mt-0 space-y-6" value="background">
              <NarrativeBuilder />
            </TabsContent>

            <TabsContent className="mt-0" value="requirements">
              <RequirementList />
            </TabsContent>

            <TabsContent className="mt-0" value="goals">
              <GoalList />
            </TabsContent>

            <TabsContent className="mt-0" value="milestones">
              <MilestoneList />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
