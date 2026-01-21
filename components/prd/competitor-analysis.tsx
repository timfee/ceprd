"use client";

import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { performCompetitiveResearch } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePRDStore } from "@/lib/store";
import { type Competitor } from "@/lib/types";

interface CompetitorItemProps {
  comp: Competitor;
  onGenerateReqs: (compName: string, gaps: string[]) => void;
}

const CompetitorItem = memo(({ comp, onGenerateReqs }: CompetitorItemProps) => {
  const handleGenerate = useCallback(() => {
    onGenerateReqs(comp.name, comp.featureGaps);
  }, [comp.name, comp.featureGaps, onGenerateReqs]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          {comp.name}
          {comp.url && (
            <Link
              className="text-muted-foreground transition-colors hover:text-primary"
              href={comp.url}
              rel="noopener noreferrer"
              target="_blank"
              title="Visit website"
            >
              <ExternalLink className="h-5 w-5" />
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {comp.analysis && (
          <div className="rounded-lg border-primary/20 border-l-4 bg-muted/30 p-4 text-muted-foreground italic">
            {comp.analysis}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-green-100 bg-green-50/10 p-4 dark:border-green-900/30">
            <div className="flex items-center gap-2 font-semibold text-green-600 text-sm uppercase tracking-wide dark:text-green-400">
              <TrendingUp className="h-4 w-4" /> Strengths
            </div>
            <ul className="list-disc space-y-2 pl-4 text-foreground/80 text-sm">
              {comp.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border border-red-100 bg-red-50/10 p-4 dark:border-red-900/30">
            <div className="flex items-center gap-2 font-semibold text-red-600 text-sm uppercase tracking-wide dark:text-red-400">
              <AlertTriangle className="h-4 w-4" /> Weaknesses
            </div>
            <ul className="list-disc space-y-2 pl-4 text-foreground/80 text-sm">
              {comp.weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-purple-100 bg-purple-50/20 p-4 dark:border-purple-900/30">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold text-purple-700 text-sm uppercase tracking-wide dark:text-purple-400">
              Feature Gaps
            </span>
            <Button
              className="h-8 w-8 text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/50"
              onClick={handleGenerate}
              size="icon"
              title="Generate requirements from these gaps"
              variant="ghost"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {comp.featureGaps.map((gap) => (
              <Badge
                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300 hover:dark:bg-purple-900/50"
                key={gap}
                variant="outline"
              >
                {gap}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CompetitorItem.displayName = "CompetitorItem";

/**
 * Displays competitive research and allows generating requirements from gaps.
 */
export function CompetitorAnalysis() {
  const competitors = usePRDStore((state) => state.prd.context.competitors);
  const title = usePRDStore((state) => state.prd.meta.title);
  const { setCompetitors, addRequirement } = usePRDStore(
    (state) => state.actions
  );

  const [isResearching, setIsResearching] = useState(false);

  const handleResearch = useCallback(async () => {
    setIsResearching(true);
    try {
      const results = await performCompetitiveResearch(
        title || "Enterprise Software"
      );
      // Hydrate with IDs since the AI returns raw objects
      const hydrated = results.map((c) => ({
        ...c,
        id: uuidv4(),
        url: c.url || "",
      }));
      setCompetitors(hydrated);
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setIsResearching(false);
    }
  }, [title, setCompetitors]);

  const handleGenerateReqs = useCallback(
    (compName: string, gaps: string[]) => {
      for (const gap of gaps) {
        addRequirement({
          description: `Competitor ${compName} offers "${gap}". We should evaluate implementing a similar or superior capability to remain competitive.`,
          // User must assign
          primaryActorId: "",
          priority: "P2",
          secondaryActorIds: [],
          status: "Draft",
          title: `Address Gap: ${gap}`,
          type: "System Behavior",
        });
      }
    },
    [addRequirement]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xl">Competitive Landscape</h2>
          <p className="text-muted-foreground text-sm">
            AI-driven market research using Google Search Grounding.
          </p>
        </div>
        <Button disabled={isResearching} onClick={handleResearch}>
          {isResearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Run Market Research
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {competitors.map((comp) => (
          <CompetitorItem
            comp={comp}
            key={comp.id}
            onGenerateReqs={handleGenerateReqs}
          />
        ))}
      </div>

      {competitors.length === 0 && !isResearching && (
        <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
          No competitive data yet. Click &quot;Run Market Research&quot; to
          analyze the market.
        </div>
      )}
    </div>
  );
}
