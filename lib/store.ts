import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { type FocusSection } from "./knowledge";
import {
  type Actor,
  type Competitor,
  type Goal,
  type Milestone,
  type NarrativeBlock,
  type PRD,
  type Requirement,
  type Term,
} from "./schemas";

export interface PRDState {
  activeSection: FocusSection;
  activeNodeIds: string[];
  focusMode: boolean;
  appStatus: "idle" | "initializing" | "ready";
  prd: PRD;
  actions: {
    setAppStatus: (status: "idle" | "initializing" | "ready") => void;
    clearActiveFocus: () => void;
    setFocusMode: (enabled: boolean) => void;
    setActiveFocus: (section: FocusSection, nodeIds: string[]) => void;
    setActiveSection: (section: FocusSection) => void;
    setDiscoveryMode: (mode: PRD["meta"]["discoveryMode"]) => void;
    updateTitle: (title: string) => void;
    //...
    addActor: (actor: Omit<Actor, "id"> & { id?: string }) => void;
    updateActor: (id: string, updates: Partial<Actor>) => void;
    removeActor: (id: string) => void;
    addTerm: (term: Omit<Term, "id">) => void;
    updateTerm: (id: string, updates: Partial<Term>) => void;
    removeTerm: (id: string) => void;
    setCompetitors: (competitors: Competitor[]) => void;
    toggleCompetitor: (id: string) => void;
    addRequirement: (req: Omit<Requirement, "id">) => void;
    updateRequirement: (id: string, updates: Partial<Requirement>) => void;
    removeRequirement: (id: string) => void;
    moveRequirement: (id: string, direction: "up" | "down") => void;
    updateTLDR: (data: Partial<PRD["sections"]["tldr"]>) => void;
    updateBackground: (data: Partial<PRD["sections"]["background"]>) => void;
    addNarrativeBlock: (block: Omit<NarrativeBlock, "id">) => void;
    updateNarrativeBlock: (id: string, content: string) => void;
    removeNarrativeBlock: (id: string) => void;
    moveNarrativeBlock: (id: string, direction: "up" | "down") => void;
    addGoal: (goal: Omit<Goal, "id">) => void;
    updateGoal: (id: string, data: Partial<Goal>) => void;
    removeGoal: (id: string) => void;
    addMilestone: (milestone: Omit<Milestone, "id">) => void;
    updateMilestone: (id: string, data: Partial<Milestone>) => void;
    removeMilestone: (id: string) => void;
  };
}

const initialPRD: PRD = {
  context: {
    actors: [],
    competitors: [],
    glossary: [],
  },
  meta: {
    discoveryMode: "default",
    id: uuidv4(),
    lastUpdated: new Date(),
    status: "Draft",
    title: "Untitled PRD",
    version: 1,
  },
  sections: {
    background: {
      blocks: [],
      context: "",
      marketDrivers: [],
    },
    goals: [],
    milestones: [],
    requirements: [],
    tldr: {
      problem: "",
      solution: "",
      valueProps: [],
    },
  },
};

export const usePRDStore = create<PRDState>()(
  immer((set) => ({
    actions: {
      addActor: (actor) =>
        set((state) => {
          state.prd.context.actors.push({ ...actor, id: actor.id || uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      addGoal: (goal) =>
        set((state) => {
          state.prd.sections.goals.push({ ...goal, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      addMilestone: (milestone) =>
        set((state) => {
          state.prd.sections.milestones.push({ ...milestone, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      addNarrativeBlock: (block) =>
        set((state) => {
          state.prd.sections.background.blocks.push({ ...block, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      addRequirement: (req) =>
        set((state) => {
          state.prd.sections.requirements.push({ ...req, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      addTerm: (term) =>
        set((state) => {
          state.prd.context.glossary.push({ ...term, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      clearActiveFocus: () =>
        set((state) => {
          state.activeNodeIds = [];
        }),
      moveNarrativeBlock: (id, direction) =>
        set((state) => {
          const index = state.prd.sections.background.blocks.findIndex(
            (b) => b.id === id
          );
          if (index === -1) {
            return;
          }

          const newIndex = direction === "up" ? index - 1 : index + 1;
          if (
            newIndex < 0 ||
            newIndex >= state.prd.sections.background.blocks.length
          ) {
            return;
          }

          const newBlocks = [...state.prd.sections.background.blocks];
          const temp = newBlocks[index];
          if (temp && newBlocks[newIndex]) {
            newBlocks[index] = newBlocks[newIndex];
            newBlocks[newIndex] = temp;
            state.prd.sections.background.blocks = newBlocks;
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      moveRequirement: (id, direction) =>
        set((state) => {
          const index = state.prd.sections.requirements.findIndex(
            (r) => r.id === id
          );
          if (index === -1) {
            return;
          }

          const newIndex = direction === "up" ? index - 1 : index + 1;
          if (
            newIndex < 0 ||
            newIndex >= state.prd.sections.requirements.length
          ) {
            return;
          }

          const newRequirements = [...state.prd.sections.requirements];
          const temp = newRequirements[index];
          if (temp && newRequirements[newIndex]) {
            // Swap
            newRequirements[index] = newRequirements[newIndex];
            newRequirements[newIndex] = temp;
            state.prd.sections.requirements = newRequirements;
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      removeActor: (id) =>
        set((state) => {
          state.prd.context.actors = state.prd.context.actors.filter(
            (a) => a.id !== id
          );
          state.activeNodeIds = state.activeNodeIds.filter(
            (item) => item !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      removeGoal: (id) =>
        set((state) => {
          state.prd.sections.goals = state.prd.sections.goals.filter(
            (g) => g.id !== id
          );
          state.activeNodeIds = state.activeNodeIds.filter(
            (item) => item !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      removeMilestone: (id) =>
        set((state) => {
          state.prd.sections.milestones = state.prd.sections.milestones.filter(
            (m) => m.id !== id
          );
          state.activeNodeIds = state.activeNodeIds.filter(
            (item) => item !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      removeNarrativeBlock: (id) =>
        set((state) => {
          state.prd.sections.background.blocks =
            state.prd.sections.background.blocks.filter((b) => b.id !== id);
          state.prd.meta.lastUpdated = new Date();
        }),
      removeRequirement: (id) =>
        set((state) => {
          state.prd.sections.requirements =
            state.prd.sections.requirements.filter((r) => r.id !== id);
          state.activeNodeIds = state.activeNodeIds.filter(
            (item) => item !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      removeTerm: (id) =>
        set((state) => {
          state.prd.context.glossary = state.prd.context.glossary.filter(
            (t) => t.id !== id
          );
          state.activeNodeIds = state.activeNodeIds.filter(
            (item) => item !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      setActiveFocus: (section, nodeIds) =>
        set((state) => {
          state.activeSection = section;
          state.activeNodeIds = nodeIds;
        }),
      setActiveSection: (section) =>
        set((state) => {
          state.activeSection = section;
          state.activeNodeIds = [];
        }),
      setAppStatus: (status) =>
        set((state) => {
          state.appStatus = status;
        }),
      setCompetitors: (competitors) =>
        set((state) => {
          state.prd.context.competitors = competitors;
          state.prd.meta.lastUpdated = new Date();
        }),
      setDiscoveryMode: (mode) =>
        set((state) => {
          state.prd.meta.discoveryMode = mode;
          state.prd.meta.lastUpdated = new Date();
        }),
      setFocusMode: (enabled) =>
        set((state) => {
          state.focusMode = enabled;
          if (!enabled) {
            state.activeNodeIds = [];
          }
        }),
      toggleCompetitor: (id) =>
        set((state) => {
          const comp = state.prd.context.competitors.find((c) => c.id === id);
          if (comp) {
            comp.selected = !comp.selected;
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateActor: (id, updates) =>
        set((state) => {
          const index = state.prd.context.actors.findIndex((a) => a.id === id);
          if (index !== -1 && state.prd.context.actors[index]) {
            Object.assign(state.prd.context.actors[index], updates);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateBackground: (data) =>
        set((state) => {
          Object.assign(state.prd.sections.background, data);
          state.prd.meta.lastUpdated = new Date();
        }),
      updateGoal: (id, data) =>
        set((state) => {
          const index = state.prd.sections.goals.findIndex((g) => g.id === id);
          if (index !== -1 && state.prd.sections.goals[index]) {
            Object.assign(state.prd.sections.goals[index], data);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateMilestone: (id, data) =>
        set((state) => {
          const index = state.prd.sections.milestones.findIndex(
            (m) => m.id === id
          );
          if (index !== -1 && state.prd.sections.milestones[index]) {
            Object.assign(state.prd.sections.milestones[index], data);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateNarrativeBlock: (id, content) =>
        set((state) => {
          const index = state.prd.sections.background.blocks.findIndex(
            (b) => b.id === id
          );
          if (index !== -1 && state.prd.sections.background.blocks[index]) {
            state.prd.sections.background.blocks[index].content = content;
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateRequirement: (id, updates) =>
        set((state) => {
          const index = state.prd.sections.requirements.findIndex(
            (r) => r.id === id
          );
          if (index !== -1 && state.prd.sections.requirements[index]) {
            Object.assign(state.prd.sections.requirements[index], updates);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateTLDR: (data) =>
        set((state) => {
          Object.assign(state.prd.sections.tldr, data);
          state.prd.meta.lastUpdated = new Date();
        }),
      updateTerm: (id, updates) =>
        set((state) => {
          const index = state.prd.context.glossary.findIndex(
            (t) => t.id === id
          );
          if (index !== -1 && state.prd.context.glossary[index]) {
            Object.assign(state.prd.context.glossary[index], updates);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      updateTitle: (title) =>
        //...
        set((state) => {
          state.prd.meta.title = title;
          state.prd.meta.lastUpdated = new Date();
        }),
    },
    activeNodeIds: [],
    activeSection: "tldr",
    appStatus: "idle",
    focusMode: true,
    prd: initialPRD,
  }))
);
