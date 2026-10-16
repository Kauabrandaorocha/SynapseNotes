import { connectionsRepository, ConnectionsRepository } from './connections.repository.ts';
import { Connection, ConnectionGraph, CreateConnectionDTO } from './connections.types.ts';
import { geminiAdapter } from '../../infra/llm/gemini-adapter.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.ts';

export class ConnectionsService {
  constructor(private repo: ConnectionsRepository = connectionsRepository) {}

  public async listConnections(workspaceId?: string): Promise<Connection[]> {
    const wsId = workspaceId || this.repo.getDefaultWorkspace().id;
    return this.repo.listByWorkspace(wsId);
  }

  public async getConnectionsForNote(noteId: string): Promise<Connection[]> {
    return this.repo.getForNote(noteId);
  }

  public async getGraph(workspaceId?: string): Promise<ConnectionGraph> {
    const wsId = workspaceId || this.repo.getDefaultWorkspace().id;
    const notes = this.repo.listNotes(wsId);
    const edges = this.repo.listByWorkspace(wsId);

    const nodes = notes.map((n) => ({
      id: n.id,
      title: n.title,
      tags: n.tags.map((t) => t.name),
    }));

    return {
      nodes,
      edges: edges.map((e) => ({
        id: e.id,
        source: e.sourceNoteId,
        target: e.targetNoteId,
        score: e.similarityScore,
        reason: e.reason,
      })),
    };
  }

  public async createConnection(dto: CreateConnectionDTO): Promise<Connection> {
    const source = this.repo.findNote(dto.sourceNoteId);
    if (!source) {
      throw new NotFoundError('Nota de origem não encontrada.');
    }

    const target = this.repo.findNote(dto.targetNoteId);
    if (!target) {
      throw new NotFoundError('Nota de destino não encontrada.');
    }

    if (source.id === target.id) {
      throw new BadRequestError('Não é possível conectar uma nota a si mesma.');
    }

    const wsId = dto.workspaceId || source.workspaceId;

    return this.repo.create({
      workspaceId: wsId,
      sourceNoteId: source.id,
      targetNoteId: target.id,
      targetNoteTitle: target.title,
      similarityScore: dto.similarityScore ?? 0.85,
      reason: dto.reason || 'Conexão conceitual estabelecida pelo usuário.',
    });
  }

  public async discoverConnections(noteId: string): Promise<Connection[]> {
    const source = this.repo.findNote(noteId);
    if (!source) {
      throw new NotFoundError('Nota não encontrada.');
    }

    const allNotes = this.repo.listNotes(source.workspaceId);
    const correlations = await geminiAdapter.findSynapticRelations(source, allNotes);

    const created: Connection[] = [];
    for (const corr of correlations) {
      const target = this.repo.findNote(corr.targetNoteId);
      if (target) {
        const conn = this.repo.create({
          workspaceId: source.workspaceId,
          sourceNoteId: source.id,
          targetNoteId: target.id,
          targetNoteTitle: target.title,
          similarityScore: corr.similarityScore,
          reason: corr.reason,
        });
        created.push(conn);
      }
    }

    return created;
  }
}

export const connectionsService = new ConnectionsService();
