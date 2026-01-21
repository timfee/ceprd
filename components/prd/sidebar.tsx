"use client";

import { Book, Loader2, Plus, ScanSearch, Trash2, User } from "lucide-react";
import { memo, useCallback, useState } from "react";

import { type Actor } from "@/lib/schemas";

import { identifyPotentialTerms } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PERSONA_ROLES } from "@/lib/repository";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { type Term } from "@/lib/types";

interface ActorItemProps {
  actor: Actor;
  onRemove: (id: string) => void;
}

const ActorItem = memo(({ actor, onRemove }: ActorItemProps) => {
  const handleRemove = useCallback(() => {
    onRemove(actor.id);
  }, [actor.id, onRemove]);

  return (
    <div className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/50">
      <div className="overflow-hidden">
        <div className="truncate font-medium text-sm">{actor.name}</div>
        {actor.role !== "User" && (
          <div className="truncate text-muted-foreground text-xs">
            {actor.role}
          </div>
        )}
      </div>
      <Button
        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleRemove}
        size="icon"
        variant="ghost"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
});

ActorItem.displayName = "ActorItem";

interface AddActorFormProps {
  onAdd: (name: string, role: string) => void;
  onCancel: () => void;
}

const AddActorForm = memo(({ onAdd, onCancel }: AddActorFormProps) => {
  const [newActorName, setNewActorName] = useState("");
  const [newActorRole, setNewActorRole] = useState<string>("User");

  const handleAdd = useCallback(() => {
    onAdd(newActorName, newActorRole);
  }, [newActorName, newActorRole, onAdd]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewActorName(e.target.value);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleAdd();
      }
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleAdd, onCancel]
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
      <Input
        autoFocus
        className="h-8 text-xs"
        onChange={handleNameChange}
        onKeyDown={handleKeyDown}
        placeholder="Name..."
        value={newActorName}
      />
      <Select onValueChange={setNewActorRole} value={newActorRole}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          {PERSONA_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
          <SelectItem value="User">User</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex justify-end gap-2">
        <Button
          className="h-7 text-xs"
          onClick={onCancel}
          size="sm"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button className="h-7 text-xs" onClick={handleAdd} size="sm">
          Add
        </Button>
      </div>
    </div>
  );
});

AddActorForm.displayName = "AddActorForm";

interface TermItemProps {
  term: Term;
}

const TermItem = memo(({ term }: TermItemProps) => (
  <div className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/50">
    <div className="overflow-hidden">
      <div className="truncate font-medium text-sm">{term.term}</div>
      <div className="truncate text-muted-foreground text-xs">
        {term.definition}
      </div>
    </div>
  </div>
));

TermItem.displayName = "TermItem";

interface AddTermFormProps {
  onAdd: (term: string, definition: string) => void;
  onCancel: () => void;
}

const AddTermForm = memo(({ onAdd, onCancel }: AddTermFormProps) => {
  const [newTermName, setNewTermName] = useState("");
  const [newTermDefinition, setNewTermDefinition] = useState("");

  const handleAdd = useCallback(() => {
    onAdd(newTermName, newTermDefinition);
  }, [newTermName, newTermDefinition, onAdd]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTermName(e.target.value);
    },
    []
  );

  const handleDefinitionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewTermDefinition(e.target.value);
    },
    []
  );

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleDefinitionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && e.metaKey) {
        // Cmd+Enter to submit
        handleAdd();
      }
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleAdd, onCancel]
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
      <Input
        autoFocus
        className="h-8 font-medium text-xs"
        onChange={handleNameChange}
        onKeyDown={handleNameKeyDown}
        placeholder="Term..."
        value={newTermName}
      />
      <Textarea
        className="min-h-[60px] resize-none text-xs"
        onChange={handleDefinitionChange}
        onKeyDown={handleDefinitionKeyDown}
        placeholder="Definition..."
        value={newTermDefinition}
      />
      <div className="flex justify-end gap-2">
        <Button
          className="h-7 text-xs"
          onClick={onCancel}
          size="sm"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button className="h-7 text-xs" onClick={handleAdd} size="sm">
          Add Term
        </Button>
      </div>
    </div>
  );
});

AddTermForm.displayName = "AddTermForm";

export function PRDSidebar() {
  const actors = usePRDStore((state) => state.prd.context.actors);
  const terms = usePRDStore((state) => state.prd.context.glossary);
  const hasChatStarted = usePRDStore((state) => state.hasChatStarted);
  const { addActor, removeActor, addTerm } = usePRDStore(
    (state) => state.actions
  );
  // Get content for scanning
  const prdSections = usePRDStore((state) => state.prd.sections);

  const [isAddingActor, setIsAddingActor] = useState(false);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleAddActor = useCallback(
    (name: string, role: string) => {
      if (!name.trim()) {
        return;
      }
      addActor({
        description: "",
        name,
        priority: "Primary",
        role: (role as Actor["role"]) || "User",
      });
      setIsAddingActor(false);
    },
    [addActor]
  );

  const handleAddTerm = useCallback(
    (name: string, definition: string) => {
      if (!name.trim()) {
        return;
      }
      addTerm({
        bannedSynonyms: [],
        definition: definition.trim() || "To be defined...",
        term: name,
      });
      setIsAddingTerm(false);
    },
    [addTerm]
  );

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const fullContent = `
            TLDR: ${prdSections.tldr.problem} ${prdSections.tldr.solution}
            Background: ${prdSections.background.context}
            Requirements: ${prdSections.requirements
              .map((r) => `${r.title} ${r.description}`)
              .join(" ")}
        `;

      const existingTerms = terms.map((t) => t.term);
      const newTerms = await identifyPotentialTerms(fullContent, existingTerms);

      for (const term of newTerms) {
        addTerm({
          bannedSynonyms: [],
          definition: term.definition,
          term: term.term,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  }, [prdSections, terms, addTerm]);

  const handleStartAddingActor = useCallback(() => {
    setIsAddingActor(true);
  }, []);

  const handleCancelAddingActor = useCallback(() => {
    setIsAddingActor(false);
  }, []);

  const handleStartAddingTerm = useCallback(() => {
    setIsAddingTerm(true);
  }, []);

  const handleCancelAddingTerm = useCallback(() => {
    setIsAddingTerm(false);
  }, []);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-muted/10 transition-all duration-500",
        !hasChatStarted && "pointer-events-none opacity-10 blur-sm"
      )}
    >
      <div className="p-4">
        <h2 className="font-semibold text-lg">Project Context</h2>
        <p className="text-muted-foreground text-xs">
          Define actors and glossary terms.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* ACTORS SECTION */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase">
                <User className="h-3 w-3" /> Actors
              </h3>
              <Button
                className="h-5 w-5"
                onClick={handleStartAddingActor}
                size="icon"
                variant="ghost"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-1">
              {actors.map((actor) => (
                <ActorItem
                  actor={actor}
                  key={actor.id}
                  onRemove={removeActor}
                />
              ))}

              {actors.length === 0 && !isAddingActor && (
                <div className="rounded-md border border-dashed py-3 text-center text-muted-foreground text-xs">
                  No actors defined.
                </div>
              )}

              {isAddingActor && (
                <AddActorForm
                  onAdd={handleAddActor}
                  onCancel={handleCancelAddingActor}
                />
              )}
            </div>
          </div>

          {/* GLOSSARY SECTION */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase">
                <Book className="h-3 w-3" /> Glossary
              </h3>
              <div className="flex gap-1">
                <Button
                  className="h-5 w-5"
                  disabled={isScanning}
                  onClick={handleScan}
                  size="icon"
                  title="Scan PRD for new terms"
                  variant="ghost"
                >
                  {isScanning ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ScanSearch className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  className="h-5 w-5"
                  onClick={handleStartAddingTerm}
                  size="icon"
                  variant="ghost"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {terms.map((t) => (
                <TermItem key={t.id} term={t} />
              ))}

              {terms.length === 0 && !isAddingTerm && (
                <div className="rounded-md border border-dashed py-3 text-center text-muted-foreground text-xs">
                  No terms defined.
                </div>
              )}

              {isAddingTerm && (
                <AddTermForm
                  onAdd={handleAddTerm}
                  onCancel={handleCancelAddingTerm}
                />
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
