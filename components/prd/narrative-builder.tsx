import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { refineText } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { usePRDStore } from "@/lib/store";
import { type NarrativeBlock } from "@/lib/schemas";

import { AIToolbar, type AIInstruction } from "./ai-toolbar";
import { BackgroundSelector } from "./background-selector";

interface NarrativeBlockItemProps {
  block: NarrativeBlock;
  index: number;
  isLast: boolean;
  onRemove: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

const NarrativeBlockItem = memo(
  ({
    block,
    index,
    isLast,
    onRemove,
    onUpdate,
    onMove,
  }: NarrativeBlockItemProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleContentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate(block.id, e.target.value);
      },
      [block.id, onUpdate]
    );

    const handleRefine = useCallback(
      async (instruction: AIInstruction) => {
        if (!block.content) {
          return;
        }
        setIsGenerating(true);
        try {
          const refined = await refineText(
            block.content,
            instruction,
            `Block Context: ${block.title}`
          );
          onUpdate(block.id, refined);
          toast.success("Content refined");
        } catch (error) {
          console.error(error);
          toast.error("Refinement failed");
        } finally {
          setIsGenerating(false);
        }
      },
      [block.content, block.title, block.id, onUpdate]
    );

    const handleGenerate = useCallback(async () => {
      setIsGenerating(true);
      try {
        const result = await refineText(
          `Generate a paragraph explaining the importance of "${block.title}" for this project.`,
          "Write clearly and professionally.",
          `Driver: ${block.title}`
        );
        onUpdate(block.id, result);
      } catch (error) {
        console.error(error);
        toast.error("Generation failed");
      } finally {
        setIsGenerating(false);
      }
    }, [block.title, block.id, onUpdate]);

    const handleMoveUp = useCallback(() => {
      onMove(block.id, "up");
    }, [block.id, onMove]);

    const handleMoveDown = useCallback(() => {
      onMove(block.id, "down");
    }, [block.id, onMove]);

    const handleRemove = useCallback(() => {
      onRemove(block.id);
    }, [block.id, onRemove]);

    return (
      <Card className="group relative transition-all hover:border-foreground/20 hover:shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:text-foreground"
                onClick={handleMoveUp}
                disabled={index === 0}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:text-foreground"
                onClick={handleMoveDown}
                disabled={isLast}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <GripVertical className="h-4 w-4 opacity-50" />
          </div>

          <div className="flex flex-1 items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {block.type === "driver" ? "Driver" : "Text"}
            </Badge>
            <span className="font-medium text-sm">{block.title}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-end">
              <AIToolbar
                onGenerate={
                  !block.content && block.type === "driver"
                    ? handleGenerate
                    : undefined
                }
                onRefine={handleRefine}
                isGenerating={isGenerating}
                hasContent={!!block.content}
                generateLabel="Draft Content"
              />
            </div>
            <Textarea
              className="min-h-[120px] resize-y border-transparent bg-muted/20 focus:bg-background focus:border-input transition-colors"
              placeholder={
                block.type === "driver"
                  ? `Explain how ${block.title} impacts the project...`
                  : "Enter narrative text..."
              }
              value={block.content}
              onChange={handleContentChange}
            />
          </div>
        </CardContent>
      </Card>
    );
  }
);

NarrativeBlockItem.displayName = "NarrativeBlockItem";

interface DriverMenuItemProps {
  driver: string;
  onAdd: (driver: string) => void;
}

const DriverMenuItem = memo(({ driver, onAdd }: DriverMenuItemProps) => {
  const handleClick = useCallback(() => {
    onAdd(driver);
  }, [driver, onAdd]);

  return <DropdownMenuItem onClick={handleClick}>{driver}</DropdownMenuItem>;
});
DriverMenuItem.displayName = "DriverMenuItem";

export function NarrativeBuilder() {
  const blocks = usePRDStore(
    (state) => state.prd.sections.background.blocks || []
  );
  const {
    addNarrativeBlock,
    removeNarrativeBlock,
    updateNarrativeBlock,
    moveNarrativeBlock,
  } = usePRDStore((state) => state.actions);

  const handleAddText = useCallback(() => {
    addNarrativeBlock({
      content: "",
      title: "New Section",
      type: "text",
    });
  }, [addNarrativeBlock]);

  const marketDrivers = usePRDStore(
    (state) => state.prd.sections.background.marketDrivers
  );

  const handleAddDriverBlock = useCallback(
    (driver: string) => {
      addNarrativeBlock({
        content: "",
        title: driver,
        type: "driver",
      });
    },
    [addNarrativeBlock]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-sm text-muted-foreground">
          Narrative Outline
        </h3>
        <p className="text-xs text-muted-foreground">
          Build your narrative by adding text blocks or elaborating on strategic
          drivers.
        </p>
      </div>

      <div className="space-y-4">
        {blocks.length === 0 ? (
          <EmptyState
            title="No narrative blocks"
            description="Start building your story by adding text sections or strategic drivers."
            actionLabel="Add Text Section"
            onAction={handleAddText}
          />
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <NarrativeBlockItem
                key={block.id}
                block={block}
                index={index}
                isLast={index === blocks.length - 1}
                onRemove={removeNarrativeBlock}
                onUpdate={updateNarrativeBlock}
                onMove={moveNarrativeBlock}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t pt-4">
        <Button onClick={handleAddText} variant="outline" className="gap-2">
          <Type className="h-4 w-4" />
          Add Text Block
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Driver Block
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {marketDrivers.length === 0 ? (
              <DropdownMenuItem disabled>
                No active drivers selected
              </DropdownMenuItem>
            ) : (
              marketDrivers.map((driver) => (
                <DriverMenuItem
                  key={driver}
                  driver={driver}
                  onAdd={handleAddDriverBlock}
                />
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <h4 className="mb-2 font-medium text-sm">Strategic Drivers Pool</h4>
        <BackgroundSelector />
      </div>
    </div>
  );
}
