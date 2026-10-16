import { NoteRelation } from '../../infra/database/database-adapter.ts';

export type Connection = NoteRelation;

export interface CreateConnectionDTO {
  workspaceId?: string;
  sourceNoteId: string;
  targetNoteId: string;
  similarityScore?: number;
  reason?: string;
}

export interface ConnectionGraphNode {
  id: string;
  title: string;
  tags: string[];
}

export interface ConnectionGraphEdge {
  id: string;
  source: string;
  target: string;
  score: number;
  reason: string;
}

export interface ConnectionGraph {
  nodes: ConnectionGraphNode[];
  edges: ConnectionGraphEdge[];
}
