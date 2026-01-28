import { z } from "zod";

import {
  KNOWLEDGE_EDGE_TYPES,
  KNOWLEDGE_NODE_TYPES,
  type KnowledgeEdgeType,
  type KnowledgeNodeType,
} from "./knowledge";

export interface NodeDraft {
  data?: Record<string, unknown>;
  description?: string;
  id: string;
  sourceSection: string;
  tags?: string[];
  title: string;
  type: KnowledgeNodeType;
}

export interface AIChange {
  id: string;
  op: "add" | "link" | "update";
  edgeType?: KnowledgeEdgeType;
  fromId?: string;
  node?: NodeDraft;
  nodeId?: string;
  patch?: Partial<NodeDraft>;
  toId?: string;
}

export interface Citation {
  changeId: string;
  note?: string;
  sourceNodeIds: string[];
}

export interface AIResponse {
  changes: AIChange[];
  citations: Citation[];
  narrative: string;
  newNodes: NodeDraft[];
}

export const NodeDraftSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional(),
  id: z.string(),
  sourceSection: z.string(),
  tags: z.array(z.string()).optional(),
  title: z.string(),
  type: z.enum(KNOWLEDGE_NODE_TYPES),
});

export const AIChangeSchema = z.object({
  edgeType: z.enum(KNOWLEDGE_EDGE_TYPES).optional(),
  fromId: z.string().optional(),
  id: z.string(),
  node: NodeDraftSchema.optional(),
  nodeId: z.string().optional(),
  op: z.enum(["add", "link", "update"]),
  patch: NodeDraftSchema.partial().optional(),
  toId: z.string().optional(),
});

export const CitationSchema = z.object({
  changeId: z.string(),
  note: z.string().optional(),
  sourceNodeIds: z.array(z.string()),
});

export const AIResponseSchema = z.object({
  changes: z.array(AIChangeSchema),
  citations: z.array(CitationSchema),
  narrative: z.string(),
  newNodes: z.array(NodeDraftSchema),
});
