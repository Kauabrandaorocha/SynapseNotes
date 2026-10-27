import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  currentUserRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  notesCount: number;
  createdAt: string;
}

export interface Note {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  rawContent: string;
  summary: string | null;
  transcription: string | null;
  sourceType: 'text' | 'audio' | 'link';
  sourceUrl: string | null;
  hasAudio: boolean;
  mediaDurationSeconds: number | null;
  mediaExpiresAt: string | null;
  complexityLevel: 'unprocessed' | 'low' | 'medium' | 'high';
  isProtected: boolean;
  processingStatus: 'pending' | 'processing' | 'done' | 'failed';
  errorMessage: string | null;
  tags: Tag[];
  tasksCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  noteId: string;
  noteTitle?: string;
  workspaceId: string;
  userId: string;
  content: string;
  isCompleted: boolean;
  isSuggested: boolean;
  priorityBucket: 'focus_today' | 'upcoming' | 'someday';
  dueDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRelation {
  id: string;
  workspaceId: string;
  sourceNoteId: string;
  targetNoteId: string;
  targetNoteTitle: string;
  similarityScore: number;
  reason: string;
  createdAt: string;
}

export interface Consent {
  id: string;
  userId: string;
  termVersion: string;
  aiProcessingAccepted: boolean;
  acceptedAt: string;
}

export interface NoteFilter {
  sourceType?: string;
  tag?: string;
  search?: string;
}

export class DatabaseStore {
  public users: User[] = [];
  public workspaces: Workspace[] = [];
  public notes: Note[] = [];
  public tasks: Task[] = [];
  public tags: Tag[] = [];
  public noteRelations: NoteRelation[] = [];
  public consents: Consent[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultUserId = '11111111-1111-1111-1111-111111111111';
    const defaultWorkspaceId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    this.users.push({
      id: defaultUserId,
      email: 'estudante@synapsenotes.local',
      fullName: 'Alice Pesquisadora',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const adminUserId = '00000000-0000-0000-0000-000000000001';
    this.users.push({
      id: adminUserId,
      email: 'admin@synapsenotes.com',
      fullName: 'Admin (Administrador)',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    this.workspaces.push({
      id: defaultWorkspaceId,
      name: 'Caderno de Estudos Acadêmicos',
      ownerId: defaultUserId,
      currentUserRole: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tagGenetica: Tag = {
      id: 'tag-1',
      workspaceId: defaultWorkspaceId,
      name: 'Genética',
      notesCount: 2,
      createdAt: new Date().toISOString(),
    };
    const tagBio: Tag = {
      id: 'tag-2',
      workspaceId: defaultWorkspaceId,
      name: 'Biotecnologia',
      notesCount: 1,
      createdAt: new Date().toISOString(),
    };
    const tagDireito: Tag = {
      id: 'tag-3',
      workspaceId: defaultWorkspaceId,
      name: 'Direito',
      notesCount: 1,
      createdAt: new Date().toISOString(),
    };
    const tagArtigos: Tag = {
      id: 'tag-4',
      workspaceId: defaultWorkspaceId,
      name: 'Artigos',
      notesCount: 1,
      createdAt: new Date().toISOString(),
    };

    this.tags.push(tagGenetica, tagBio, tagDireito, tagArtigos);

    const now = new Date();
    const expires20Days = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString();

    const note1Id = 'note-mock-01';
    this.notes.push({
      id: note1Id,
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      title: 'Seminário sobre Novos Primers e Eficiência de Corte Cas9',
      rawContent: 'Gravação da reunião de alinhamento com a equipe do laboratório sobre PCR e enzimas.',
      summary: 'A reunião abordou os novos protocolos de sequenciamento Illumina, a calibração de reagentes e a comparação das três réplicas biológicas com os dados publicados no mês passado.',
      transcription: 'Prof. orientador sugeriu revisar o protocolo de extração de DNA e comparar com a literatura recente antes de rodar os ensaios definitivos.',
      sourceType: 'audio',
      sourceUrl: null,
      hasAudio: true,
      mediaDurationSeconds: 1680,
      mediaExpiresAt: expires20Days,
      complexityLevel: 'high',
      isProtected: false,
      processingStatus: 'done',
      errorMessage: null,
      tags: [tagGenetica, tagBio],
      tasksCount: 1,
      deletedAt: null,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const note2Id = 'note-mock-02';
    this.notes.push({
      id: note2Id,
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      title: 'Artigo Nature: Avanços em edição genética CRISPR',
      rawContent: 'Revisão técnica de papers recentes indexados sobre CRISPR/Cas9 de alta fidelidade.',
      summary: 'Revisão técnica das novas variantes Cas9 de alta fidelidade com taxa de off-target reduzida e alta precisão em modelos celulares humanos.',
      transcription: null,
      sourceType: 'link',
      sourceUrl: 'https://nature.com/articles/crispr-advances-review-mock',
      hasAudio: false,
      mediaDurationSeconds: null,
      mediaExpiresAt: null,
      complexityLevel: 'low',
      isProtected: false,
      processingStatus: 'done',
      errorMessage: null,
      tags: [tagArtigos, tagGenetica],
      tasksCount: 0,
      deletedAt: null,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const note3Id = 'note-mock-03';
    this.notes.push({
      id: note3Id,
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      title: 'Princípios de Responsabilidade Civil no Direito',
      rawContent: 'Teoria do risco versus culpa subjetiva. Lembrar de fazer o fichamento do capítulo 3 para quinta-feira.',
      summary: 'Conceituação dos pressupostos da responsabilidade civil extracontratual e a evolução jurisprudencial da teoria do risco objetivo.',
      transcription: null,
      sourceType: 'text',
      sourceUrl: null,
      hasAudio: false,
      mediaDurationSeconds: null,
      mediaExpiresAt: null,
      complexityLevel: 'low',
      isProtected: false,
      processingStatus: 'done',
      errorMessage: null,
      tags: [tagDireito],
      tasksCount: 1,
      deletedAt: null,
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.tasks.push({
      id: 'task-mock-01',
      noteId: note1Id,
      noteTitle: 'Seminário sobre Novos Primers e Eficiência de Corte Cas9',
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      content: 'Ajustar parâmetros do termociclador para novo primer',
      isCompleted: false,
      isSuggested: false,
      priorityBucket: 'focus_today',
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.tasks.push({
      id: 'task-mock-02',
      noteId: note3Id,
      noteTitle: 'Princípios de Responsabilidade Civil no Direito',
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      content: 'Fazer fichamento do capítulo 3 para aula de Direito',
      isCompleted: false,
      isSuggested: false,
      priorityBucket: 'focus_today',
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.tasks.push({
      id: 'task-mock-03',
      noteId: note1Id,
      noteTitle: 'Seminário sobre Novos Primers e Eficiência de Corte Cas9',
      workspaceId: defaultWorkspaceId,
      userId: defaultUserId,
      content: 'Enviar e-mail para orientador com dados das réplicas biológicas',
      isCompleted: false,
      isSuggested: true,
      priorityBucket: 'upcoming',
      dueDate: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.noteRelations.push({
      id: 'rel-mock-01',
      workspaceId: defaultWorkspaceId,
      sourceNoteId: note1Id,
      targetNoteId: note2Id,
      targetNoteTitle: 'Artigo Nature: Avanços em edição genética CRISPR',
      similarityScore: 0.88,
      reason: 'Ambas as notas analisam metodologias de edição e corte com variantes de alta fidelidade Cas9.',
      createdAt: new Date().toISOString(),
    });

    this.consents.push({
      id: 'consent-mock-01',
      userId: defaultUserId,
      termVersion: 'v1.0',
      aiProcessingAccepted: true,
      acceptedAt: new Date().toISOString(),
    });
  }

  public getDefaultWorkspace(): Workspace {
    return this.workspaces[0];
  }

  public getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.find((w) => w.id === id);
  }

  public listWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  public listNotes(workspaceId: string, filter?: NoteFilter): Note[] {
    return this.notes
      .filter((n) => n.workspaceId === workspaceId && n.deletedAt === null)
      .filter((n) => {
        if (!filter) return true;
        if (filter.sourceType && n.sourceType !== filter.sourceType) {
          return false;
        }
        if (filter.tag && !n.tags.some((t) => t.name.toLowerCase() === filter.tag!.toLowerCase())) {
          return false;
        }
        if (filter.search) {
          const s = filter.search.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(s);
          const matchContent = n.rawContent?.toLowerCase().includes(s) ?? false;
          const matchSummary = n.summary?.toLowerCase().includes(s) ?? false;
          const matchTrans = n.transcription?.toLowerCase().includes(s) ?? false;
          const matchTag = n.tags.some((t) => t.name.toLowerCase().includes(s));
          return matchTitle || matchContent || matchSummary || matchTrans || matchTag;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getNote(id: string): Note | undefined {
    return this.notes.find((n) => n.id === id && n.deletedAt === null);
  }

  public createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Note {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notes.unshift(newNote);
    return newNote;
  }

  public updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'deletedAt'>>): Note | undefined {
    const note = this.notes.find((n) => n.id === id && n.deletedAt === null);
    if (!note) return undefined;
    Object.assign(note, updates, { updatedAt: new Date().toISOString() });
    return note;
  }

  public deleteNote(id: string): boolean {
    const note = this.notes.find((n) => n.id === id);
    if (note) {
      note.deletedAt = new Date().toISOString();
      this.tasks.forEach((t) => {
        if (t.noteId === id) {
          t.deletedAt = new Date().toISOString();
        }
      });
      return true;
    }
    return false;
  }

  public listTasks(workspaceId: string, bucket?: string): Task[] {
    return this.tasks
      .filter((t) => t.workspaceId === workspaceId && t.deletedAt === null)
      .filter((t) => (bucket ? t.priorityBucket === bucket : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTask(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id && t.deletedAt === null);
  }

  public createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'deletedAt'>>): Task | undefined {
    const task = this.tasks.find((t) => t.id === id && t.deletedAt === null);
    if (!task) return undefined;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    return task;
  }

  public deleteTask(id: string): boolean {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.deletedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public listTags(workspaceId: string): Tag[] {
    return this.tags.filter((t) => t.workspaceId === workspaceId);
  }

  public getOrCreateTag(workspaceId: string, name: string): Tag {
    const trimmed = name.trim();
    let tag = this.tags.find(
      (t) => t.workspaceId === workspaceId && t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!tag) {
      tag = {
        id: crypto.randomUUID(),
        workspaceId,
        name: trimmed,
        notesCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.tags.push(tag);
    }
    return tag;
  }

  public getRelationsForNote(noteId: string): NoteRelation[] {
    return this.noteRelations.filter((r) => r.sourceNoteId === noteId || r.targetNoteId === noteId);
  }

  public listRelations(workspaceId: string): NoteRelation[] {
    return this.noteRelations.filter((r) => r.workspaceId === workspaceId);
  }

  public createRelation(relation: Omit<NoteRelation, 'id' | 'createdAt'>): NoteRelation {
    const newRel: NoteRelation = {
      ...relation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.noteRelations.push(newRel);
    return newRel;
  }

  public recordConsent(userId: string, termVersion: string): void {
    this.consents.push({
      id: crypto.randomUUID(),
      userId,
      termVersion,
      aiProcessingAccepted: true,
      acceptedAt: new Date().toISOString(),
    });
  }

  public exportData(userId: string) {
    const userNotes = this.notes.filter((n) => n.userId === userId && n.deletedAt === null);
    const userTasks = this.tasks.filter((t) => t.userId === userId && t.deletedAt === null);
    const userConsents = this.consents.filter((c) => c.userId === userId);
    return {
      exportedAt: new Date().toISOString(),
      user: this.users.find((u) => u.id === userId),
      notes: userNotes,
      tasks: userTasks,
      consents: userConsents,
    };
  }

  public hardDeleteAccount(userId: string): boolean {
    this.notes = this.notes.filter((n) => n.userId !== userId);
    this.tasks = this.tasks.filter((t) => t.userId !== userId);
    this.noteRelations = this.noteRelations.filter((r) => {
      return !this.notes.some((n) => n.id === r.sourceNoteId || n.id === r.targetNoteId);
    });
    this.workspaces = this.workspaces.filter((w) => w.ownerId !== userId);
    this.consents = this.consents.filter((c) => c.userId !== userId);
    this.users = this.users.filter((u) => u.id !== userId);
    return true;
  }
}

export const db = new DatabaseStore();
