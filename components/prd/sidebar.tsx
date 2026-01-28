"use client";

import {
  Book,
  Check,
  Loader2,
  Pencil,
  Plus,
  ScanSearch,
  Settings,
  Target,
  Trash2,
  User,
  X,
} from "lucide-react";
import { memo, useCallback, useState } from "react";

import { type Actor, type Term } from "@/lib/schemas";

import { identifyPotentialTerms } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PERSONA_ROLES } from "@/lib/repository";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActorItemProps {
  actor: Actor;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Actor>) => void;
}

const ActorItem = memo(({ actor, onRemove, onUpdate }: ActorItemProps) => {
  const setActiveFocus = usePRDStore((state) => state.actions.setActiveFocus);
  const activeNodeIds = usePRDStore((state) => state.activeNodeIds);
  const focusMode = usePRDStore((state) => state.focusMode);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(actor.name);
  const [editRole, setEditRole] = useState(actor.role);

  const handleRemove = useCallback(() => {
    onRemove(actor.id);
  }, [actor.id, onRemove]);

  const handleEdit = useCallback(() => {
    setActiveFocus("actors", [actor.id]);
    setIsEditing(true);
    setEditName(actor.name);
    setEditRole(actor.role);
  }, [actor.id, actor.name, actor.role, setActiveFocus]);

  const handleFocus = useCallback(() => {
    setActiveFocus("actors", [actor.id]);
  }, [actor.id, setActiveFocus]);

  const handleSave = useCallback(() => {
    if (editName.trim()) {
      onUpdate(actor.id, { name: editName.trim(), role: editRole });
      setIsEditing(false);
    }
  }, [actor.id, editName, editRole, onUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditName(actor.name);
    setEditRole(actor.role);
  }, [actor.name, actor.role]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditName(e.target.value);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleEdit();
      }
    },
    [handleEdit]
  );

  const handleRoleChange = useCallback((val: string) => {
    setEditRole(val as Actor["role"]);
  }, []);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-2">
        <Input
          className="h-8 text-sm"
          value={editName}
          onChange={handleNameChange}
          placeholder="Actor name"
          autoFocus
        />
        <Select onValueChange={handleRoleChange} value={editRole}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERSONA_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="default"
            className="h-7 flex-1 cursor-pointer"
            onClick={handleSave}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 flex-1 cursor-pointer"
            onClick={handleCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  const isFocused = activeNodeIds.includes(actor.id);
  const shouldDim = focusMode && activeNodeIds.length > 0 && !isFocused;

  return (
    <div
      className={cn(
        "group flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50",
        isFocused && "bg-primary/10",
        shouldDim && "opacity-60"
      )}
    >
      <button
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left"
        onClick={handleEdit}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-1">
          <span className="break-words">{actor.name}</span>
          {actor.role !== "User" && (
            <span className="text-xs text-muted-foreground">
              ({actor.role})
            </span>
          )}
        </div>
      </button>
      <div className="flex shrink-0 gap-1">
        <Button
          className="h-6 w-6 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleFocus}
          size="icon"
          variant="ghost"
        >
          <Target className="h-3 w-3 text-muted-foreground" />
        </Button>
        <Button
          className="h-6 w-6 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleEdit}
          size="icon"
          variant="ghost"
        >
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </Button>
        <Button
          className="h-6 w-6 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleRemove}
          size="icon"
          variant="ghost"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
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

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
      <Input
        autoFocus
        className="h-8 text-xs"
        onChange={handleNameChange}
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
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Term>) => void;
}

const TermItem = memo(({ term, onRemove, onUpdate }: TermItemProps) => {
  const setActiveFocus = usePRDStore((state) => state.actions.setActiveFocus);
  const activeNodeIds = usePRDStore((state) => state.activeNodeIds);
  const focusMode = usePRDStore((state) => state.focusMode);
  const [isEditing, setIsEditing] = useState(false);
  const [editTerm, setEditTerm] = useState(term.term);
  const [editDefinition, setEditDefinition] = useState(term.definition);

  const handleRemove = useCallback(() => {
    onRemove(term.id);
  }, [term.id, onRemove]);

  const handleEdit = useCallback(() => {
    setActiveFocus("glossary", [term.id]);
    setIsEditing(true);
    setEditTerm(term.term);
    setEditDefinition(term.definition);
  }, [setActiveFocus, term.definition, term.id, term.term]);

  const handleFocus = useCallback(() => {
    setActiveFocus("glossary", [term.id]);
  }, [setActiveFocus, term.id]);

  const handleSave = useCallback(() => {
    if (editTerm.trim() && editDefinition.trim()) {
      onUpdate(term.id, {
        definition: editDefinition.trim(),
        term: editTerm.trim(),
      });
      setIsEditing(false);
    }
  }, [term.id, editTerm, editDefinition, onUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditTerm(term.term);
    setEditDefinition(term.definition);
  }, [term.term, term.definition]);

  const handleTermChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditTerm(e.target.value);
    },
    []
  );

  const handleDefinitionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditDefinition(e.target.value);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleEdit();
      }
    },
    [handleEdit]
  );

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-2">
        <Input
          className="h-8 text-sm font-medium"
          value={editTerm}
          onChange={handleTermChange}
          placeholder="Term"
          autoFocus
        />
        <Textarea
          className="min-h-20 text-sm"
          value={editDefinition}
          onChange={handleDefinitionChange}
          placeholder="Definition"
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="default"
            className="h-7 flex-1 cursor-pointer"
            onClick={handleSave}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 flex-1 cursor-pointer"
            onClick={handleCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  const isFocused = activeNodeIds.includes(term.id);
  const shouldDim = focusMode && activeNodeIds.length > 0 && !isFocused;

  return (
    <div
      className={cn(
        "group flex flex-col gap-0.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50",
        isFocused && "bg-primary/10",
        shouldDim && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left font-medium"
          onClick={handleEdit}
          onKeyDown={handleKeyDown}
          type="button"
        >
          <Book className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="break-words">{term.term}</span>
        </button>
        <div className="flex shrink-0 gap-1">
          <Button
            className="h-6 w-6 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleFocus}
            size="icon"
            variant="ghost"
          >
            <Target className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            className="h-6 w-6 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleEdit}
            size="icon"
            variant="ghost"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            className="h-6 w-6 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleRemove}
            size="icon"
            variant="ghost"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
      <div className="break-words pl-5 text-xs text-muted-foreground">
        {term.definition}
      </div>
    </div>
  );
});

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

  const handleDefChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewTermDefinition(e.target.value);
    },
    []
  );

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
      <Input
        autoFocus
        className="h-8 font-medium text-xs"
        onChange={handleNameChange}
        placeholder="Term..."
        value={newTermName}
      />
      <Textarea
        className="min-h-[60px] resize-none text-xs"
        onChange={handleDefChange}
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
  const {
    addActor,
    removeActor,
    addTerm,
    removeTerm,
    updateActor,
    updateTerm,
    setActiveSection,
  } = usePRDStore((state) => state.actions);
  const prdSections = usePRDStore((state) => state.prd.sections);

  const [isAddingActor, setIsAddingActor] = useState(false);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleAddActor = useCallback(
    (name: string, role: string) => {
      if (!name.trim()) {
        return;
      }
      setActiveSection("actors");
      addActor({
        description: "",
        name,
        priority: "Primary",
        role: (role as Actor["role"]) || "User",
      });
      setIsAddingActor(false);
    },
    [addActor, setActiveSection]
  );

  const handleAddTerm = useCallback(
    (name: string, definition: string) => {
      if (!name.trim()) {
        return;
      }
      setActiveSection("glossary");
      addTerm({
        bannedSynonyms: [],
        definition: definition.trim() || "To be defined...",
        term: name,
      });
      setIsAddingTerm(false);
    },
    [addTerm, setActiveSection]
  );

  const handleScan = useCallback(async () => {
    setActiveSection("glossary");
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
  }, [prdSections, terms, addTerm, setActiveSection]);

  const toggleAddingActor = useCallback(() => setIsAddingActor(true), []);
  const cancelAddingActor = useCallback(() => setIsAddingActor(false), []);
  const toggleAddingTerm = useCallback(() => setIsAddingTerm(true), []);
  const cancelAddingTerm = useCallback(() => setIsAddingTerm(false), []);

  return (
    <div className="flex h-full w-80 flex-col border-r bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="font-semibold text-sm">Project Context</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-medium text-muted-foreground">
                Actors
              </span>
              <Button
                className="h-5 w-5"
                onClick={toggleAddingActor}
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
                  onUpdate={updateActor}
                />
              ))}
              {isAddingActor && (
                <AddActorForm
                  onAdd={handleAddActor}
                  onCancel={cancelAddingActor}
                />
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-medium text-muted-foreground">
                Glossary
              </span>
              <div className="flex items-center gap-1">
                <Button
                  className="h-5 w-5"
                  disabled={isScanning}
                  onClick={handleScan}
                  size="icon"
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
                  onClick={toggleAddingTerm}
                  size="icon"
                  variant="ghost"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {terms.map((term) => (
                <TermItem
                  key={term.id}
                  term={term}
                  onRemove={removeTerm}
                  onUpdate={updateTerm}
                />
              ))}
              {isAddingTerm && (
                <AddTermForm
                  onAdd={handleAddTerm}
                  onCancel={cancelAddingTerm}
                />
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
