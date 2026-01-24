import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { performCompetitiveResearch } from "@/app/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { type PRDState, usePRDStore } from "@/lib/store";

interface CompetitorAnalysisProps {
  title?: string;
  problem?: string;
}

interface CompetitorCardProps {
  competitor: PRDState["prd"]["context"]["competitors"][0];
  onToggle: (id: string) => void;
}

function CompetitorCard({ competitor, onToggle }: CompetitorCardProps) {
  const handleToggle = useCallback(() => {
    onToggle(competitor.id);
  }, [competitor.id, onToggle]);

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Card className={competitor.selected ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Checkbox
              checked={competitor.selected}
              className="mt-1"
              id={`competitor-${competitor.id}`}
              onCheckedChange={handleToggle}
            />
            <div className="flex-1">
              <label
                className="cursor-pointer"
                htmlFor={`competitor-${competitor.id}`}
              >
                <CardTitle className="flex items-center gap-2 text-xl">
                  {competitor.name}
                  {competitor.url && (
                    <Link
                      className="text-muted-foreground transition-colors hover:text-primary"
                      href={competitor.url}
                      onClick={handleLinkClick}
                      rel="noopener noreferrer"
                      target="_blank"
                      title="Visit website"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </CardTitle>
                <CardDescription className="mt-1.5">
                  {competitor.analysis}
                </CardDescription>
              </label>
            </div>
          </div>
          {competitor.selected && (
            <Badge className="ml-2" variant="default">
              Active Context
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 font-medium text-green-600 text-sm dark:text-green-500">
            Strengths
          </h4>
          <ul className="space-y-1.5">
            {competitor.strengths.map((strength) => (
              <li
                className="flex items-start gap-2 text-muted-foreground text-sm"
                key={strength}
              >
                <span className="mt-0.5 text-green-600 dark:text-green-500">
                  •
                </span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-orange-600 text-sm dark:text-orange-500">
            Weaknesses
          </h4>
          <ul className="space-y-1.5">
            {competitor.weaknesses.map((weakness) => (
              <li
                className="flex items-start gap-2 text-muted-foreground text-sm"
                key={weakness}
              >
                <span className="mt-0.5 text-orange-600 dark:text-orange-500">
                  •
                </span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>

        {competitor.featureGaps.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-blue-600 text-sm dark:text-blue-500">
              Opportunities & Gaps
            </h4>
            <ul className="space-y-1.5">
              {competitor.featureGaps.map((gap) => (
                <li
                  className="flex items-start gap-2 text-muted-foreground text-sm"
                  key={gap}
                >
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-500" />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompetitorAnalysis({
  problem,
  title,
}: CompetitorAnalysisProps) {
  const competitors = usePRDStore((state) => state.prd.context.competitors);
  const { setCompetitors, addRequirement, toggleCompetitor } = usePRDStore(
    (state) => state.actions
  );

  const [isResearching, setIsResearching] = useState(false);

  const hasMinimumContext = Boolean(title && problem);
  const selectedCompetitors = competitors.filter((c) => c.selected);
  const hasSelectedCompetitors = selectedCompetitors.length > 0;

  const handleResearch = useCallback(async () => {
    if (!title || !problem) {
      return;
    }
    setIsResearching(true);
    try {
      // Use both title and problem for better context
      const query = `${title}: ${problem}`;
      const results = await performCompetitiveResearch(query);

      // Hydrate with IDs since the AI returns raw objects

      const hydrated = results.map((c) => ({
        ...c,

        id: uuidv4(),

        // Default to not selected

        selected: false,

        url: c.url || "",
      }));

      setCompetitors(hydrated);
    } catch (error) {
      console.error("Research failed:", error);
      toast.error("Failed to analyze competitors. Please try again.");
    } finally {
      setIsResearching(false);
    }
  }, [title, problem, setCompetitors]);

  const handleGenerateReqs = useCallback(() => {
    for (const comp of selectedCompetitors) {
      for (const gap of comp.featureGaps) {
        addRequirement({
          description: `Competitor ${comp.name} offers "${gap}". We should evaluate implementing a similar or superior capability to remain competitive.`,

          // User must assign

          primaryActorId: "",

          priority: "P2",

          secondaryActorIds: [],

          status: "Draft",

          title: `Address Gap: ${gap}`,

          type: "System Behavior",
        });
      }
    }
  }, [selectedCompetitors, addRequirement]);

  // Not enough context state

  if (!hasMinimumContext) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-2xl">Market Research</h2>

            <p className="mt-1 text-muted-foreground text-sm">
              Analyze competitors to identify opportunities and gaps in the
              market
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />

          <AlertDescription className="ml-2">
            <strong className="font-medium">
              Not enough context to analyze competitors
            </strong>

            <p className="mt-2 text-sm">
              Please complete the following before running market research:
            </p>

            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              {!title && <li>Add a product title</li>}

              {!problem && <li>Define the Core Problem</li>}
            </ul>

            <p className="mt-3 text-muted-foreground text-sm">
              These details help us find relevant competitors and provide
              meaningful analysis instead of generic results.
            </p>
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="mb-4 h-12 w-12 text-muted-foreground/50" />

            <h3 className="mb-2 font-medium text-lg">
              Ready to analyze the market?
            </h3>

            <p className="max-w-md text-muted-foreground text-sm">
              Once you&apos;ve added your product title and problem statement,
              we&apos;ll research competitors and identify strategic
              opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-2xl">Market Research</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Identify competitors and discover opportunities to differentiate
            your product
          </p>
        </div>
        <Button
          className="gap-2"
          disabled={isResearching}
          onClick={handleResearch}
          size="lg"
        >
          {isResearching ? (
            <>
              <Spinner className="h-4 w-4" />
              Analyzing...
            </>
          ) : (
            <span>
              {competitors.length > 0
                ? "Refresh Analysis"
                : "Analyze Competitors"}
            </span>
          )}
        </Button>
      </div>

      {/* Context being used */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="space-y-1">
              <p className="font-medium text-sm">
                Analyzing based on your context:
              </p>
              <div className="space-y-1 text-muted-foreground text-sm">
                <p>
                  <span className="font-medium">Product:</span> {title}
                </p>
                <p>
                  <span className="font-medium">Problem:</span> {problem}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors list */}
      {competitors.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-lg">Competitors Found</h3>
              <p className="text-muted-foreground text-sm">
                Select competitors to use as context for generating requirements
              </p>
            </div>
            {hasSelectedCompetitors && (
              <Badge variant="secondary" className="ml-2">
                {selectedCompetitors.length} selected
              </Badge>
            )}
          </div>

          <div className="grid gap-4">
            {competitors.map((competitor) => (
              <CompetitorCard
                competitor={competitor}
                key={competitor.id}
                onToggle={toggleCompetitor}
              />
            ))}
          </div>

          {/* Generate requirements action */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">
                    Generate Requirements from Market Insights
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {hasSelectedCompetitors ? (
                      <>
                        Create product requirements based on{" "}
                        {selectedCompetitors.length} selected{" "}
                        {selectedCompetitors.length === 1
                          ? "competitor"
                          : "competitors"}
                        . These insights will be used as context throughout your
                        PRD.
                      </>
                    ) : (
                      "Select one or more competitors above to generate targeted requirements from their gaps and opportunities."
                    )}
                  </p>
                </div>
                <Button
                  onClick={handleGenerateReqs}
                  disabled={!hasSelectedCompetitors}
                  size="lg"
                  className="shrink-0 gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Draft Requirements from Gaps
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No competitors yet */}
      {competitors.length === 0 && !isResearching && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 font-medium text-lg">
              No competitors analyzed yet
            </h3>
            <p className="max-w-md text-muted-foreground text-sm">
              Click &quot;Analyze Competitors&quot; to research the market and
              identify opportunities for your product.
            </p>
          </CardContent>
        </Card>
      )}

      {isResearching && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Spinner className="mb-4 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Researching competitors and analyzing market opportunities...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
