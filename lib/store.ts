import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Actor,
  Competitor,
  Goal,
  Milestone,
  PRD,
  Requirement,
  Term,
} from "./schemas";

export interface PRDState {
  hasChatStarted: boolean;
  prd: PRD;
  actions: {
    setHasChatStarted: (started: boolean) => void;
    updateTitle: (title: string) => void;
    //...
    addActor: (actor: Omit<Actor, "id"> & { id?: string }) => void;
    updateActor: (id: string, updates: Partial<Actor>) => void;
    removeActor: (id: string) => void;
    addTerm: (term: Omit<Term, "id">) => void;
    setCompetitors: (competitors: Competitor[]) => void;
    addRequirement: (req: Omit<Requirement, "id">) => void;
    updateRequirement: (id: string, updates: Partial<Requirement>) => void;
    removeRequirement: (id: string) => void;
    updateTLDR: (data: Partial<PRD["sections"]["tldr"]>) => void;
    updateBackground: (data: Partial<PRD["sections"]["background"]>) => void;
    addGoal: (goal: Omit<Goal, "id">) => void;
    updateGoal: (id: string, data: Partial<Goal>) => void;
    removeGoal: (id: string) => void;
    addMilestone: (milestone: Omit<Milestone, "id">) => void;
    updateMilestone: (id: string, data: Partial<Milestone>) => void;
    removeMilestone: (id: string) => void;
  };
}

const initialPRD: PRD = {
  meta: {
    id: uuidv4(),
    title: "Untitled PRD",
    lastUpdated: new Date(),
    version: 1,
    status: "Draft",
  },
  context: {
    actors: [],
    glossary: [],
    competitors: [],
  },
  sections: {
    tldr: {
      problem: "",
      solution: "",
      valueProps: [],
    },
    background: {
      context: "",
      marketDrivers: [],
    },
    goals: [],
    requirements: [],
    milestones: [],
  },
};

export const usePRDStore = create<PRDState>()(
  immer((set) => ({
    hasChatStarted: false,
    prd: initialPRD,
    actions: {
      setHasChatStarted: (started) =>
        set((state) => {
          state.hasChatStarted = started;
        }),
      updateTitle: (title) =>
        //...
        set((state) => {
          state.prd.meta.title = title;
          state.prd.meta.lastUpdated = new Date();
        }),
      addActor: (actor) =>
        set((state) => {
          state.prd.context.actors.push({ ...actor, id: actor.id || uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      updateActor: (id, updates) =>
        set((state) => {
          const index = state.prd.context.actors.findIndex((a) => a.id === id);
          if (index !== -1) {
            state.prd.context.actors[index] = {
              ...state.prd.context.actors[index],
              ...updates,
            };
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      removeActor: (id) =>
        set((state) => {
          state.prd.context.actors = state.prd.context.actors.filter(
            (a) => a.id !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      addTerm: (term) =>
        set((state) => {
          state.prd.context.glossary.push({ ...term, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      setCompetitors: (competitors) =>
        set((state) => {
          state.prd.context.competitors = competitors;
          state.prd.meta.lastUpdated = new Date();
        }),
      addRequirement: (req) =>
        set((state) => {
          state.prd.sections.requirements.push({ ...req, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      updateRequirement: (id, updates) =>
        set((state) => {
          const index = state.prd.sections.requirements.findIndex(
            (r) => r.id === id
          );
          if (index !== -1) {
            state.prd.sections.requirements[index] = {
              ...state.prd.sections.requirements[index],
              ...updates,
            };
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      removeRequirement: (id) =>
        set((state) => {
          state.prd.sections.requirements =
            state.prd.sections.requirements.filter((r) => r.id !== id);
          state.prd.meta.lastUpdated = new Date();
        }),
      updateTLDR: (data) =>
        set((state) => {
          Object.assign(state.prd.sections.tldr, data);
          state.prd.meta.lastUpdated = new Date();
        }),
      updateBackground: (data) =>
        set((state) => {
          Object.assign(state.prd.sections.background, data);
          state.prd.meta.lastUpdated = new Date();
        }),
      addGoal: (goal) =>
        set((state) => {
          state.prd.sections.goals.push({ ...goal, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      updateGoal: (id, data) =>
        set((state) => {
          const index = state.prd.sections.goals.findIndex((g) => g.id === id);
          if (index !== -1) {
            Object.assign(state.prd.sections.goals[index], data);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      removeGoal: (id) =>
        set((state) => {
          state.prd.sections.goals = state.prd.sections.goals.filter(
            (g) => g.id !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
      addMilestone: (milestone) =>
        set((state) => {
          state.prd.sections.milestones.push({ ...milestone, id: uuidv4() });
          state.prd.meta.lastUpdated = new Date();
        }),
      updateMilestone: (id, data) =>
        set((state) => {
          const index = state.prd.sections.milestones.findIndex(
            (m) => m.id === id
          );
          if (index !== -1) {
            Object.assign(state.prd.sections.milestones[index], data);
            state.prd.meta.lastUpdated = new Date();
          }
        }),
      removeMilestone: (id) =>
        set((state) => {
          state.prd.sections.milestones = state.prd.sections.milestones.filter(
            (m) => m.id !== id
          );
          state.prd.meta.lastUpdated = new Date();
        }),
    },
  }))
);
