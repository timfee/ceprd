"use client";

import {
  Book,
  Check,
  Loader2,
  Plus,
  ScanSearch,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
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
import type { Actor } from "@/lib/schemas";
import { usePRDStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  const [newActorName, setNewActorName] = useState("");
  const [newActorRole, setNewActorRole] = useState<string>("User");

  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [newTermName, setNewTermName] = useState("");
  const [newTermDefinition, setNewTermDefinition] = useState("");

  const [isScanning, setIsScanning] = useState(false);

  const handleAddActor = () => {
    if (!newActorName.trim()) {
      return;
    }
    addActor({
      name: newActorName,
      role: (newActorRole as Actor["role"]) || "User",
      priority: "Primary",
      description: "",
    });
    setNewActorName("");
    setNewActorRole("User");
    setIsAddingActor(false);
  };

  const handleAddTerm = () => {
    if (!newTermName.trim()) {
      return;
    }
    addTerm({
      term: newTermName,
      definition: newTermDefinition.trim() || "To be defined...",
      bannedSynonyms: [],
    });
    setNewTermName("");
    setNewTermDefinition("");
    setIsAddingTerm(false);
  };

  const handleScan = async () => {
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
          term: term.term,
          definition: term.definition,
          bannedSynonyms: [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-muted/10">
      <div className="p-4">
        <h2 className="font-semibold text-lg">Project Context</h2>
        <p className="text-muted-foreground text-xs">
          Define actors and glossary terms.
        </p>
      </div>

      <ScrollArea
        className={cn(
          "flex-1 transition-all duration-500",
          !hasChatStarted && "pointer-events-none opacity-50 blur-[1px]"
        )}
      >
        <div className="space-y-6 p-4">
          {/* ACTORS SECTION */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase">
                <User className="h-3 w-3" /> Actors
              </h3>
              <Button
                className="h-5 w-5"
                onClick={() => setIsAddingActor(true)}
                size="icon"
                variant="ghost"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-1">
              {actors.map((actor) => (
                <div
                  className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/50"
                  key={actor.id}
                >
                  <div className="overflow-hidden">
                    <div className="truncate font-medium text-sm">
                      {actor.name}
                    </div>
                    {actor.role !== "User" && (
                      <div className="truncate text-muted-foreground text-xs">
                        {actor.role}
                      </div>
                    )}
                  </div>
                  <Button
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeActor(actor.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}

              {actors.length === 0 && !isAddingActor && (
                <div className="rounded-md border border-dashed py-3 text-center text-muted-foreground text-xs">
                  No actors defined.
                </div>
              )}

              {isAddingActor && (
                <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
                  <Input
                    autoFocus
                    className="h-8 text-xs"
                    onChange={(e) => setNewActorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddActor();
                      if (e.key === "Escape") setIsAddingActor(false);
                    }}
                    placeholder="Name..."
                    value={newActorName}
                  />
                  <Select
                    onValueChange={setNewActorRole}
                    value={newActorRole}
                  >
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
                      onClick={() => setIsAddingActor(false)}
                      size="sm"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={handleAddActor}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
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
                  onClick={() => setIsAddingTerm(true)}
                  size="icon"
                  variant="ghost"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {terms.map((t) => (
                <div
                  className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/50"
                  key={t.id}
                >
                  <div className="overflow-hidden">
                    <div className="truncate font-medium text-sm">{t.term}</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {t.definition}
                    </div>
                  </div>
                </div>
              ))}

              {terms.length === 0 && !isAddingTerm && (
                <div className="rounded-md border border-dashed py-3 text-center text-muted-foreground text-xs">
                  No terms defined.
                </div>
              )}

              {isAddingTerm && (
                <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
                  <Input
                    autoFocus
                    className="h-8 font-medium text-xs"
                    onChange={(e) => setNewTermName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        // focus textarea or submit? let's just focus textarea usually, but user might hit enter
                      }
                      if (e.key === "Escape") setIsAddingTerm(false);
                    }}
                    placeholder="Term..."
                    value={newTermName}
                  />
                  <Textarea
                    className="min-h-[60px] resize-none text-xs"
                    onChange={(e) => setNewTermDefinition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) handleAddTerm(); // Cmd+Enter to submit
                      if (e.key === "Escape") setIsAddingTerm(false);
                    }}
                    placeholder="Definition..."
                    value={newTermDefinition}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      className="h-7 text-xs"
                      onClick={() => setIsAddingTerm(false)}
                      size="sm"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={handleAddTerm}
                      size="sm"
                    >
                      Add Term
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}