export interface ApiTag {
  id: string;
  name: string;
  notesCount?: number;
  createdAt: string;
}

export interface ApiTask {
  id: string;
  noteId: string;
  noteTitle?: string;
  workspaceId: string;
  userId: string;
  content: string;
  isCompleted: boolean;
  isSuggested: boolean;
  priorityBucket: 'focus_today' | 'upcoming' | 'someday';
  dueDate?: string | null;
  createdAt: string;
}

export interface ApiRelation {
  id: string;
  workspaceId: string;
  sourceNoteId: string;
  targetNoteId: string;
  targetNoteTitle: string;
  similarityScore: number;
  reason: string;
  createdAt: string;
}

export interface ApiNote {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  rawContent: string;
  summary: string | null;
  transcription: string | null;
  sourceType: 'text' | 'audio' | 'link';
  sourceUrl?: string | null;
  hasAudio: boolean;
  mediaDurationSeconds?: number | null;
  mediaExpiresAt?: string | null;
  complexityLevel: 'unprocessed' | 'low' | 'medium' | 'high';
  isProtected: boolean;
  processingStatus: 'pending' | 'processing' | 'done' | 'failed';
  errorMessage?: string | null;
  tags: ApiTag[];
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * Gestão de Autenticação Segura via Cookies HttpOnly
 * 
 * Por conformidade estrita de segurança e proteção contra XSS (Cross-Site Scripting),
 * os tokens JWT NUNCA são persistidos em localStorage ou sessionStorage.
 * O navegador gerencia o envio transparente do cookie 'accessToken' através de
 * credentials: 'include' com as diretivas HttpOnly, Secure, SameSite=Lax e Max-Age.
 */
export const getAuthToken = (): string | null => null;
export const setAuthToken = (_token: string | null): void => {};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // 25s timeout controller to guarantee requests never hang indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Envia e recebe cookies HttpOnly automaticamente
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    let json: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      json = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Resposta inesperada do servidor (${response.status}): ${text.slice(0, 100)}`);
    }

    if (!response.ok || !json.success) {
      const errorMsg = json?.error?.message || `Erro ${response.status}: Falha na requisição`;
      throw new Error(errorMsg);
    }

    // Persiste cópia local para garantia de visualização offline
    if (!options.method || options.method === 'GET') {
      try {
        if (endpoint.startsWith('/notes') && !endpoint.includes('/', 7)) {
          localStorage.setItem('synapse_offline_notes_backup', JSON.stringify(json.data));
        } else if (endpoint.startsWith('/tasks')) {
          localStorage.setItem('synapse_offline_tasks_backup', JSON.stringify(json.data));
        } else if (endpoint.startsWith('/tags')) {
          localStorage.setItem('synapse_offline_tags_backup', JSON.stringify(json.data));
        }
      } catch {}
    }

    return json.data;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Recupera dados salvos caso a conexão esteja offline
    if (!options.method || options.method === 'GET') {
      try {
        if (endpoint.startsWith('/notes') && !endpoint.includes('/', 7)) {
          const cached = localStorage.getItem('synapse_offline_notes_backup');
          if (cached) return JSON.parse(cached);
        } else if (endpoint.startsWith('/tasks')) {
          const cached = localStorage.getItem('synapse_offline_tasks_backup');
          if (cached) return JSON.parse(cached);
        } else if (endpoint.startsWith('/tags')) {
          const cached = localStorage.getItem('synapse_offline_tags_backup');
          if (cached) return JSON.parse(cached);
        }
      } catch {}
    }

    if (err.name === 'AbortError') {
      throw new Error('A requisição excedeu o tempo limite. Verifique sua conexão e tente novamente.');
    }
    throw err;
  }
}

export const api = {
  getNotes: (params?: { search?: string; tag?: string; sourceType?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.tag) query.append('tag', params.tag);
    if (params?.sourceType) query.append('sourceType', params.sourceType);
    const qs = query.toString();
    return request<ApiNote[]>(`/notes${qs ? `?${qs}` : ''}`);
  },

  getNote: (id: string) => {
    return request<{ note: ApiNote; relations: ApiRelation[] }>(`/notes/${id}`);
  },

  createNote: (data: {
    title: string;
    content?: string;
    sourceType?: 'text' | 'link';
    sourceUrl?: string;
    isProtected?: boolean;
    tagNames?: string[];
  }) => {
    return request<ApiNote>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateNote: (
    id: string,
    data: {
      title?: string;
      rawContent?: string;
      summary?: string;
      sourceUrl?: string;
      isProtected?: boolean;
      tagNames?: string[];
    },
  ) => {
    return request<ApiNote>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  createAudioNote: (data: {
    title?: string;
    audioData: string;
    mimeType?: string;
    durationSeconds?: number;
  }) => {
    return request<ApiNote>('/notes/audio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteNote: (id: string) => {
    return request<{ message: string }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  },

  getTasks: (params?: { bucket?: string }) => {
    const query = new URLSearchParams();
    if (params?.bucket) query.append('bucket', params.bucket);
    const qs = query.toString();
    return request<ApiTask[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  createTask: (data: {
    content: string;
    priorityBucket?: 'focus_today' | 'upcoming' | 'someday';
    noteId?: string;
    dueDate?: string;
  }) => {
    return request<ApiTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTask: (
    id: string,
    data: {
      isCompleted?: boolean;
      priorityBucket?: 'focus_today' | 'upcoming' | 'someday';
      content?: string;
    },
  ) => {
    return request<ApiTask>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  approveTask: (id: string) => {
    return request<ApiTask>(`/tasks/${id}/approve`, {
      method: 'POST',
    });
  },

  deleteTask: (id: string) => {
    return request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  getTags: () => {
    return request<ApiTag[]>('/tags');
  },

  getHealth: () => {
    return request<{ status: string }>('/health');
  },

  ensureAuthSession: async (): Promise<boolean> => {
    try {
      await request<{ user: any }>('/auth/session');
      return true;
    } catch (e) {
      console.warn('[API] Falha ao obter sessão segura via cookie HttpOnly:', e);
      return false;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[API] Falha ao efetuar logout:', e);
    }
  },

  /**
   * Recuperação de áudio protegido via Cookie HttpOnly seguro, convertendo em Blob URL local.
   * Não expõe rotas internas na UI e mantém controle estrito de propriedade (Ownership).
   */
  fetchSecureAudioBlob: async (noteIdOrUrl: string): Promise<string> => {
    let endpoint: string;
    if (noteIdOrUrl.startsWith('/api/')) {
      endpoint = noteIdOrUrl;
    } else if (noteIdOrUrl.startsWith('/media/')) {
      endpoint = `/api${noteIdOrUrl}`;
    } else if (noteIdOrUrl.startsWith('audio-')) {
      endpoint = `/api/media/${noteIdOrUrl}`;
    } else {
      // É o ID da nota
      endpoint = `/api/notes/${noteIdOrUrl}/audio`;
    }

    // O navegador transmite automaticamente o cookie HttpOnly seguro 'accessToken'
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Acesso não autorizado: Sessão não autenticada. Faça login para ouvir o áudio.');
      }
      if (response.status === 403) {
        throw new Error('Acesso negado: Você não possui permissão para ouvir este áudio privado.');
      }
      if (response.status === 404) {
        throw new Error('Gravação de áudio não encontrada ou arquivo removido.');
      }
      throw new Error(`Falha ao obter áudio privado (HTTP ${response.status}).`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};

