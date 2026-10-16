import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Mic,
  Search,
  Sparkles,
  CheckCircle2,
  Circle,
  Trash2,
  ExternalLink,
  Radio,
  FileText,
  Volume2,
  Clock,
  Tag as TagIcon,
  Sun,
  Moon,
  ChevronRight,
  ListTodo,
  Network,
  HelpCircle,
  Edit3,
  RotateCcw,
  Copy,
  X,
} from 'lucide-react';
import { api, type ApiNote, type ApiTask, type ApiTag, type ApiRelation } from './services/api.ts';
import { useAudioRecorder } from './hooks/use-audio-recorder.ts';
import { Button } from './components/ui/button.tsx';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/ui/card.tsx';
import { Input } from './components/ui/input.tsx';
import { Modal } from './components/ui/modal.tsx';
import { FormField } from './components/ui/form-field.tsx';
import { EmptyState } from './components/ui/empty-state.tsx';
import { Spinner } from './components/ui/spinner.tsx';
import { Alert } from './components/ui/alert.tsx';

export const MAX_TAGS_PER_NOTE = 6;

type TabType = 'notes' | 'tasks' | 'relations';

export function formatAudioDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) {
    return 'Áudio';
  }
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function getNoteLink(
  note?: { sourceType?: string; sourceUrl?: string | null; rawContent?: string | null } | null,
): string | null {
  if (!note) return null;
  if (note.sourceUrl && typeof note.sourceUrl === 'string' && note.sourceUrl.trim()) {
    const trimmed = note.sourceUrl.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  }
  if (note.rawContent && typeof note.rawContent === 'string') {
    const match = note.rawContent.trim().match(/https?:\/\/[^\s]+/i);
    if (match) return match[0];
  }
  return null;
}

export function cleanNoteTitle(title?: string | null): string {
  if (!title) return '';
  return title.replace(/^Gravação de Voz\s*—\s*\d{1,2}\/\d{1,2}\/\d{2,4}$/i, 'Gravação de Voz');
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('synapse_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('synapse_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Main Data States
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null);

  // Modals state
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ApiNote | null>(null);
  const [noteRelations, setNoteRelations] = useState<ApiRelation[]>([]);
  const [isLoadingNoteDetail, setIsLoadingNoteDetail] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // New Note Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSourceType, setNewSourceType] = useState<'text' | 'link'>('text');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [createNoteError, setCreateNoteError] = useState<string | null>(null);

  // New Task Form State
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskBucket, setNewTaskBucket] = useState<'focus_today' | 'upcoming' | 'someday'>('upcoming');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Audio Recorder Hook
  const audioRecorder = useAudioRecorder();
  const [audioNoteTitle, setAudioNoteTitle] = useState('');
  const [isSavingAudio, setIsSavingAudio] = useState(false);
  const [audioSaveError, setAudioSaveError] = useState<string | null>(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch all primary data
  const loadData = useCallback(async (isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      const [fetchedNotes, fetchedTasks, fetchedTags] = await Promise.all([
        api.getNotes(),
        api.getTasks(),
        api.getTags(),
      ]);
      setNotes(fetchedNotes);
      setTasks(fetchedTasks);
      setTags(fetchedTags);
    } catch (err: any) {
      if (!isPolling) {
        showToast(`Erro ao carregar dados: ${err.message}`);
      }
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reactive polling for background AI processing
  // When any note has status 'processing' or 'pending', poll every 2.5s
  useEffect(() => {
    const hasPendingProcessing = notes.some(
      (n) => n.processingStatus === 'processing' || n.processingStatus === 'pending',
    );
    if (!hasPendingProcessing) return;

    const interval = setInterval(() => {
      loadData(true);
      // Also update selectedNote if open
      if (selectedNote) {
        api.getNote(selectedNote.id).then((res) => {
          setSelectedNote(res.note);
          setNoteRelations(res.relations);
        }).catch(() => {});
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [notes, selectedNote, loadData]);

  // Handle Note Details View
  const handleOpenNote = async (note: ApiNote) => {
    setSelectedNote(note);
    setIsEditingNote(false);
    setEditTitle(cleanNoteTitle(note.title));
    setEditContent(note.rawContent);
    setEditSourceUrl(note.sourceUrl || '');
    setEditTags(note.tags ? note.tags.map((t) => t.name) : []);
    setNewTagInput('');
    setIsLoadingNoteDetail(true);
    try {
      const detail = await api.getNote(note.id);
      setSelectedNote(detail.note);
      setNoteRelations(detail.relations);
      if (detail.note.sourceUrl) {
        setEditSourceUrl(detail.note.sourceUrl);
      }
      if (detail.note.tags) {
        setEditTags(detail.note.tags.map((t) => t.name));
      }
    } catch {
      // keep current selected note
    } finally {
      setIsLoadingNoteDetail(false);
    }
  };

  // Tag Management in Note Edit
  const handleAddEditTag = (tagName: string) => {
    const clean = tagName.trim().replace(/^#/, '');
    if (!clean) return;
    if (editTags.length >= MAX_TAGS_PER_NOTE) {
      showToast(`Limite máximo de ${MAX_TAGS_PER_NOTE} tags atingido.`);
      return;
    }
    if (editTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      showToast('Esta tag já foi adicionada.');
      return;
    }
    setEditTags((prev) => [...prev, clean]);
    setNewTagInput('');
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditTags((prev) => prev.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  // Immediate Note Creation with Background AI Processing (Optimistic UX)
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateNoteError('O título da nota é obrigatório.');
      return;
    }

    setCreateNoteError(null);
    setIsSubmittingNote(true);

    const tagNamesList = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const created = await api.createNote({
        title: newTitle.trim(),
        content: newContent.trim() || undefined,
        sourceType: newSourceType,
        sourceUrl: newSourceUrl.trim() || undefined,
        tagNames: tagNamesList,
      });

      // Instantly add to notes list
      setNotes((prev) => [created, ...prev]);

      // Reset form & close modal immediately (no blocking!)
      setNewTitle('');
      setNewContent('');
      setNewSourceUrl('');
      setNewTags('');
      setNewSourceType('text');
      setIsNewNoteModalOpen(false);

      showToast('Nota criada com sucesso! A IA está processando em segundo plano.');

      // Refresh tags and tasks silently
      api.getTags().then(setTags).catch(() => {});
    } catch (err: any) {
      setCreateNoteError(err.message || 'Falha ao criar nota.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Save Note Edit
  const handleSaveNoteEdit = async () => {
    if (!selectedNote) return;
    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: editTitle.trim(),
        rawContent: editContent.trim(),
        sourceUrl: editSourceUrl.trim() || undefined,
        tagNames: editTags,
      });
      setSelectedNote(updated);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setIsEditingNote(false);
      showToast('Nota atualizada com sucesso.');
      // Atualizar lista global de tags
      api.getTags().then(setTags).catch(() => {});
    } catch (err: any) {
      showToast(`Erro ao atualizar: ${err.message}`);
    }
  };

  // Handle Note Deletion
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta nota?')) return;
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      showToast('Nota excluída.');
    } catch (err: any) {
      showToast(`Erro ao excluir nota: ${err.message}`);
    }
  };

  // Save Audio Note com captura segura e persistência imediata
  const handleSaveAudioNote = async () => {
    setIsSavingAudio(true);
    setAudioSaveError(null);

    try {
      // Finaliza e extrai o áudio sem condição de corrida
      const audioData = await audioRecorder.stopAndGetAudio();

      if (!audioData.base64) {
        throw new Error('Nenhum dado de áudio foi gravado. Clique em Iniciar Gravação primeiro.');
      }

      // Persistência imediata via backend (retorna em <50ms com status processing)
      const created = await api.createAudioNote({
        title: audioNoteTitle.trim() || undefined,
        audioData: audioData.base64,
        mimeType: audioData.mimeType,
        durationSeconds: audioData.duration,
      });

      // Atualização otimista imediata na lista de notas
      setNotes((prev) => [created, ...prev]);

      // Limpa os estados do gravador e fecha o modal
      audioRecorder.resetRecording();
      setAudioNoteTitle('');
      setIsAudioModalOpen(false);

      showToast('Áudio salvo com sucesso! O Gemini está transcrevendo e analisando em segundo plano.');

      // Dispara atualização reativa para capturar a transcrição concluída
      loadData(true);
    } catch (err: any) {
      console.error('[Save Audio Note Error]:', err);
      setAudioSaveError(err.message || 'Falha ao processar gravação. Tente novamente.');
    } finally {
      setIsSavingAudio(false);
    }
  };

  // Task Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    setTaskError(null);
    setIsSubmittingTask(true);
    try {
      const created = await api.createTask({
        content: newTaskContent.trim(),
        priorityBucket: newTaskBucket,
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskContent('');
      showToast('Tarefa adicionada.');
    } catch (err: any) {
      setTaskError(err.message || 'Não foi possível adicionar a tarefa.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleToggleTask = async (task: ApiTask) => {
    try {
      const updated = await api.updateTask(task.id, {
        isCompleted: !task.isCompleted,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      showToast(`Erro ao atualizar tarefa: ${err.message}`);
    }
  };

  const handleApproveTask = async (task: ApiTask) => {
    try {
      const approved = await api.approveTask(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? approved : t)));
      showToast('Sugestão de tarefa aprovada!');
    } catch (err: any) {
      showToast(`Erro ao aprovar: ${err.message}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      showToast(`Erro ao excluir tarefa: ${err.message}`);
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        searchQuery === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.rawContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.summary && n.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag =
        !selectedTag || n.tags.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase());

      const matchesSource = !selectedSourceType || n.sourceType === selectedSourceType;

      return matchesSearch && matchesTag && matchesSource;
    });
  }, [notes, searchQuery, selectedTag, selectedSourceType]);

  // Grouped tasks
  const focusTodayTasks = useMemo(
    () => tasks.filter((t) => t.priorityBucket === 'focus_today'),
    [tasks],
  );
  const upcomingTasks = useMemo(
    () => tasks.filter((t) => t.priorityBucket === 'upcoming'),
    [tasks],
  );
  const somedayTasks = useMemo(
    () => tasks.filter((t) => t.priorityBucket === 'someday'),
    [tasks],
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col w-full min-w-0 overflow-x-hidden antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <aside
          aria-label="Notificações do sistema"
          className="fixed bottom-4 right-4 z-50 max-w-[90vw] sm:max-w-md bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-popover)] rounded-[var(--radius-md)] p-3 text-xs flex items-center gap-2.5 transition-all"
        >
          <Sparkles className="h-4 w-4 text-[var(--accent)] shrink-0" />
          <p className="flex-1 min-w-0 break-words leading-tight">{toastMessage}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setToastMessage(null)}
            className="h-6 w-6 text-[var(--text-muted)] shrink-0"
          >
            ×
          </Button>
        </aside>
      )}

      {/* TOP HEADER: Clean Editorial Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 min-w-0">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-sm">
              SN
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold leading-tight tracking-tight text-[var(--text-primary)] truncate">
                SynapseNotes
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                Segundo Cérebro Inteligente
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-1 min-w-0">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Notas & Pensamentos ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Tarefas Extraídas ({tasks.filter((t) => !t.isCompleted).length})
            </button>
            <button
              onClick={() => setActiveTab('relations')}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors ${
                activeTab === 'relations'
                  ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sinapses & Conexões
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAudioModalOpen(true)}
              className="text-xs gap-1.5 px-2.5 sm:px-3 h-8 shrink-0 text-[var(--accent)] border-[var(--accent)]/30 hover:bg-[var(--accent-subtle)]"
              title="Gravar Áudio com transcrição IA"
            >
              <Mic className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Gravar</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsNewNoteModalOpen(true)}
              className="text-xs gap-1.5 px-2.5 sm:px-3 h-8 shrink-0 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Nova Nota</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Alternar tema claro/escuro"
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center border-t border-[var(--border-subtle)] px-3 py-1.5 overflow-x-auto gap-2 bg-[var(--surface-subtle)]">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded-[var(--radius-xs)] font-medium ${
              activeTab === 'notes'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Notas ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded-[var(--radius-xs)] font-medium ${
              activeTab === 'tasks'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Tarefas ({tasks.filter((t) => !t.isCompleted).length})
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded-[var(--radius-xs)] font-medium ${
              activeTab === 'relations'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Conexões
          </button>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER: Max-W-7xl centralizado com preenchimento responsivo */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 min-w-0">
        {/* ========================================================================= */}
        {/* TAB 1: NOTAS E PENSAMENTOS */}
        {/* ========================================================================= */}
        {activeTab === 'notes' && (
          <section className="space-y-6 w-full min-w-0">
            {/* Search, Filter Bar and Tags Chips */}
            <div className="flex flex-col gap-3 w-full min-w-0 bg-[var(--surface)] p-3 sm:p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-subtle)]">
              {/* Row 1: Search and Type Selectors */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Buscar em títulos, conteúdos e sínteses da IA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs w-full min-w-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-decoration]:hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Limpar busca"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedSourceType(null)}
                    className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedSourceType === null
                        ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Todos ({notes.length})
                  </button>
                  <button
                    onClick={() => setSelectedSourceType('text')}
                    className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedSourceType === 'text'
                        ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <FileText className="h-3 w-3" /> Textos
                  </button>
                  <button
                    onClick={() => setSelectedSourceType('audio')}
                    className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedSourceType === 'audio'
                        ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Volume2 className="h-3 w-3" /> Áudios
                  </button>
                  <button
                    onClick={() => setSelectedSourceType('link')}
                    className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedSourceType === 'link'
                        ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <ExternalLink className="h-3 w-3" /> Links
                  </button>
                </div>
              </div>

              {/* Row 2: Tag filters with elegant orange active state and distinct reset box */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)] min-w-0">
                  <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1 flex items-center gap-1">
                    <TagIcon className="h-3 w-3" /> Tags:
                  </span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-[11px] px-2.5 py-0.5 rounded-[var(--radius-xs)] font-medium flex items-center gap-1.5 transition-all bg-red-800 text-white border border-red-800 hover:bg-red-900 dark:bg-red-950/80 dark:text-white dark:border-red-800/60 dark:hover:bg-red-900/60 shadow-xs cursor-pointer shrink-0"
                      title="Limpar filtro aplicado e exibir todas as notas"
                    >
                      <RotateCcw className="h-3 w-3 shrink-0 opacity-90 text-white" />
                      <span className="text-white font-medium">Limpar Filtro</span>
                      <span className="text-xs font-bold leading-none text-white/90">×</span>
                    </button>
                  )}
                  {tags.map((tag) => {
                    const isSelected = selectedTag?.toLowerCase() === tag.name.toLowerCase();
                    return (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTag(isSelected ? null : tag.name)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-[var(--radius-xs)] transition-all truncate max-w-[140px] font-medium border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-700 text-amber-50 border-amber-700 hover:bg-amber-800 dark:bg-amber-800 dark:text-amber-100 dark:border-amber-700/80 dark:hover:bg-amber-700/80 shadow-xs'
                            : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] border-[var(--border)]'
                        }`}
                        title={tag.name}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note Grid / List */}
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <p className="text-xs text-[var(--text-muted)]">Carregando sinapses...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <EmptyState
                title="Nenhuma nota encontrada"
                description={
                  searchQuery || selectedTag || selectedSourceType
                    ? 'Tente ajustar os filtros ou o termo de busca para encontrar suas notas.'
                    : 'Você ainda não registrou pensamentos. Crie sua primeira nota ou grave um áudio para a IA analisar!'
                }
                action={
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button size="sm" onClick={() => setIsNewNoteModalOpen(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Criar Primeira Nota
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsAudioModalOpen(true)}>
                      <Mic className="h-3.5 w-3.5 mr-1 text-[var(--accent)]" /> Gravar Voz
                    </Button>
                  </div>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0 relative">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => {
                    const isProcessing =
                      note.processingStatus === 'processing' || note.processingStatus === 'pending';
                    const noteUrl = getNoteLink(note);

                    return (
                      <motion.div
                        key={note.id}
                        layout="position"
                        initial={{ opacity: 0, scale: 0.94, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          scale: 0.92,
                          y: -8,
                          transition: { duration: 0.18, ease: 'easeOut' },
                        }}
                        transition={{
                          duration: 0.24,
                          ease: [0.16, 1, 0.3, 1],
                          layout: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                        }}
                        className="flex flex-col h-full min-w-0 w-full"
                      >
                        <Card
                          onClick={() => handleOpenNote(note)}
                          className="group cursor-pointer hover:border-[var(--accent)]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between w-full min-w-0 max-w-full overflow-hidden flex-1 h-full"
                        >
                          <CardHeader className="space-y-2 p-4 sm:p-5 min-w-0">
                            {/* Status & Type Bar */}
                            <div className="flex items-center justify-between gap-2 min-w-0 text-[11px] text-[var(--text-muted)]">
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                {note.sourceType === 'audio' ? (
                                  <span className="flex items-center gap-1 text-[var(--accent)] font-medium">
                                    <Volume2 className="h-3 w-3 shrink-0" />
                                    {formatAudioDuration(note.mediaDurationSeconds)}
                                  </span>
                                ) : note.sourceType === 'link' ? (
                                  <span
                                    role={noteUrl ? 'button' : undefined}
                                    tabIndex={noteUrl ? 0 : undefined}
                                    onClick={
                                      noteUrl
                                        ? (e) => {
                                            e.stopPropagation();
                                            window.open(noteUrl, '_blank', 'noopener,noreferrer');
                                          }
                                        : undefined
                                    }
                                    onKeyDown={
                                      noteUrl
                                        ? (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.stopPropagation();
                                              window.open(noteUrl, '_blank', 'noopener,noreferrer');
                                            }
                                          }
                                        : undefined
                                    }
                                    title={noteUrl ? `Acessar artigo ou estudo: ${noteUrl}` : 'Nota do tipo Link'}
                                    className={`flex items-center gap-1 font-semibold truncate ${
                                      noteUrl
                                        ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer group/link'
                                        : 'text-blue-600 dark:text-blue-400'
                                    }`}
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" /> Link
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 shrink-0" /> Texto
                                  </span>
                                )}
                                <span>·</span>
                                <span className="font-mono text-[10px] truncate">
                                  {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              {/* Processing Badge Indicator */}
                              {isProcessing ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium shrink-0 animate-pulse"
                                  title="A inteligência artificial está analisando esta nota em segundo plano"
                                >
                                  <Sparkles className="h-2.5 w-2.5" /> IA analisando...
                                </span>
                              ) : note.tasksCount > 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)] shrink-0"
                                  title={`${note.tasksCount} tarefas extraídas`}
                                >
                                  <CheckCircle2 className="h-2.5 w-2.5 text-[var(--success)]" /> {note.tasksCount} tarefas
                                </span>
                              ) : null}
                            </div>

                            {/* Title with Word Break Protection */}
                            <CardTitle
                              style={{ fontFamily: 'Plus Jakarta Sans, var(--font-sans)' }}
                              className="text-sm sm:text-base font-semibold tracking-tight leading-snug break-words line-clamp-2 text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors font-sans"
                            >
                              {cleanNoteTitle(note.title)}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="p-4 sm:p-5 pt-0 flex-1 min-w-0 space-y-2">
                            {/* AI Summary / Synthesis or Raw Content Excerpt */}
                            {note.summary ? (
                              <p className="text-xs text-stone-900 dark:text-stone-200 font-normal leading-relaxed break-words line-clamp-3">
                                "{note.summary}"
                              </p>
                            ) : note.rawContent ? (
                              <p className="text-xs text-stone-900 dark:text-stone-200 font-normal leading-relaxed break-words line-clamp-3">
                                {note.rawContent}
                              </p>
                            ) : (
                              <p className="text-xs text-[var(--text-muted)] italic">
                                Nota sem conteúdo adicional.
                              </p>
                            )}

                            {/* Tags with Safe Truncation */}
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 pt-1 min-w-0">
                                {note.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-hover)] px-1.5 py-0.5 rounded-[var(--radius-xs)] truncate max-w-[100px]"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                                {note.tags.length > 3 && (
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    +{note.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="p-3 sm:p-4 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] min-w-0">
                            <span className="text-[10px] uppercase font-sans font-medium tracking-wider">
                              {note.complexityLevel !== 'unprocessed' ? `Nível ${note.complexityLevel}` : 'Pendente'}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNote(note.id);
                                }}
                                className="h-6 w-6 text-[var(--text-muted)] hover:text-[var(--error)]"
                                title="Excluir nota"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TAREFAS EXTRAÍDAS PELA IA */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <section className="space-y-6 w-full min-w-0">
            {/* Header com Formulário Rápido */}
            <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-subtle)] space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Gerenciador de Tarefas Cognitivas
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Tarefas extraídas de suas notas pela IA e organizadas por prioridade.
                  </p>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  {tasks.filter((t) => t.isCompleted).length} de {tasks.length} concluídas
                </div>
              </div>

              {/* Form de Nova Tarefa */}
              <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2 min-w-0">
                <Input
                  type="text"
                  placeholder="Adicionar tarefa rápida..."
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  className="flex-1 min-w-0 h-9 text-xs"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={newTaskBucket}
                    onChange={(e: any) => setNewTaskBucket(e.target.value)}
                    className="h-9 px-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)]"
                  >
                    <option value="focus_today">Foco Hoje (Max 3)</option>
                    <option value="upcoming">Próximas</option>
                    <option value="someday">Algum Dia</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={isSubmittingTask || !newTaskContent.trim()}
                    size="sm"
                    className="h-9 px-3 text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shrink-0"
                  >
                    Adicionar
                  </Button>
                </div>
              </form>
              {taskError && (
                <p className="text-xs text-[var(--error)] break-words font-medium">{taskError}</p>
              )}
            </div>

            {/* Grid dos 3 Buckets de Tarefas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0">
              {/* Bucket 1: Foco Hoje (Max 3) */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] p-4 space-y-3 min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                    <Radio className="h-3 w-3" /> Foco Hoje
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {focusTodayTasks.filter((t) => !t.isCompleted).length}/3
                  </span>
                </div>

                {focusTodayTasks.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                    Nenhuma tarefa prioritária definida para hoje.
                  </p>
                ) : (
                  <div className="space-y-2 min-w-0">
                    {focusTodayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-[var(--radius-sm)] border transition-all flex items-start gap-2.5 min-w-0 ${
                          task.isCompleted
                            ? 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] opacity-60'
                            : 'bg-[var(--surface)] border-[var(--border)] shadow-xs'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--success)] shrink-0"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs break-words leading-tight ${
                              task.isCompleted
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)] font-medium'
                            }`}
                          >
                            {task.content}
                          </p>
                          {task.noteTitle && (
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--text-muted)] mt-1">
                              <span className="truncate">Ref: {task.noteTitle}</span>
                              {(() => {
                                const parentNote = notes.find((n) => n.id === task.noteId);
                                const taskUrl = getNoteLink(parentNote);
                                if (!taskUrl) return null;
                                return (
                                  <a
                                    href={taskUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                                    title={`Acessar artigo ou estudo: ${taskUrl}`}
                                  >
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                    <span>Ver artigo</span>
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)] shrink-0 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bucket 2: Próximas */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] p-4 space-y-3 min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                    <ListTodo className="h-3 w-3" /> Próximas
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {upcomingTasks.filter((t) => !t.isCompleted).length}
                  </span>
                </div>

                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                    Nenhuma tarefa em fila.
                  </p>
                ) : (
                  <div className="space-y-2 min-w-0">
                    {upcomingTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-[var(--radius-sm)] border transition-all flex items-start gap-2.5 min-w-0 ${
                          task.isCompleted
                            ? 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] opacity-60'
                            : 'bg-[var(--surface)] border-[var(--border)] shadow-xs'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--success)] shrink-0"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs break-words leading-tight ${
                              task.isCompleted
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {task.content}
                          </p>
                          {task.noteTitle && (
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--text-muted)] mt-1">
                              <span className="truncate">Ref: {task.noteTitle}</span>
                              {(() => {
                                const parentNote = notes.find((n) => n.id === task.noteId);
                                const taskUrl = getNoteLink(parentNote);
                                if (!taskUrl) return null;
                                return (
                                  <a
                                    href={taskUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                                    title={`Acessar artigo ou estudo: ${taskUrl}`}
                                  >
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                    <span>Ver artigo</span>
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                          {task.isSuggested && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1 py-0.2 rounded font-medium">
                                Sugestão IA
                              </span>
                              <button
                                onClick={() => handleApproveTask(task)}
                                className="text-[10px] text-[var(--accent)] hover:underline font-medium"
                              >
                                Confirmar
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)] shrink-0 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bucket 3: Algum Dia */}
              <div className="bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] p-4 space-y-3 min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Algum Dia
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {somedayTasks.filter((t) => !t.isCompleted).length}
                  </span>
                </div>

                {somedayTasks.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                    Nenhuma tarefa para o futuro.
                  </p>
                ) : (
                  <div className="space-y-2 min-w-0">
                    {somedayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-[var(--radius-sm)] border transition-all flex items-start gap-2.5 min-w-0 ${
                          task.isCompleted
                            ? 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] opacity-60'
                            : 'bg-[var(--surface)] border-[var(--border)] shadow-xs'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--success)] shrink-0"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs break-words leading-tight ${
                              task.isCompleted
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {task.content}
                          </p>
                          {task.noteTitle && (
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--text-muted)] mt-1">
                              <span className="truncate">Ref: {task.noteTitle}</span>
                              {(() => {
                                const parentNote = notes.find((n) => n.id === task.noteId);
                                const taskUrl = getNoteLink(parentNote);
                                if (!taskUrl) return null;
                                return (
                                  <a
                                    href={taskUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                                    title={`Acessar artigo ou estudo: ${taskUrl}`}
                                  >
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                    <span>Ver artigo</span>
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)] shrink-0 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SINAPSES & CONEXÕES DE IA */}
        {/* ========================================================================= */}
        {activeTab === 'relations' && (
          <section className="space-y-6 w-full min-w-0">
            <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-subtle)] space-y-2 min-w-0">
              <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Network className="h-4 w-4 text-[var(--accent)]" /> Grafo de Correlações Semânticas
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                A IA analisa continuamente o conteúdo de cada nova nota e localiza automaticamente pontos em comum, teorias correlacionadas e pontes conceituais com outras anotações do seu acervo.
              </p>
            </div>

            {notes.length < 2 ? (
              <EmptyState
                title="Conexões Insuficientes"
                description="Crie pelo menos 2 notas para que o motor de inteligência artificial localize correlações e semelhanças conceituais entre elas."
                action={
                  <Button size="sm" onClick={() => setIsNewNoteModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Criar Mais Notas
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
                {notes.map((n) => (
                  <Card key={n.id} className="p-4 space-y-3 min-w-0 max-w-full overflow-hidden">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h3 className="text-xs font-semibold tracking-tight text-[var(--text-primary)] break-words line-clamp-1">
                        {n.title}
                      </h3>
                      <button
                        onClick={() => handleOpenNote(n)}
                        className="text-[11px] text-[var(--accent)] hover:underline shrink-0 font-medium"
                      >
                        Ver detalhes
                      </button>
                    </div>

                    <p className="text-xs text-stone-900 dark:text-stone-200 font-normal leading-relaxed line-clamp-2 break-words">
                      {n.summary || n.rawContent.slice(0, 100)}
                    </p>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)] min-w-0">
                      <span className="truncate">
                        {n.tags.length > 0 ? n.tags.map((t) => t.name).join(' · ') : 'Sem tags'}
                      </span>
                      <span className="font-mono">{n.tasksCount} tarefas</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CRIAR NOVA NOTA (Criação Imediata & Análise em Segundo Plano) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        title="Criar Nova Nota"
        description="Salve pensamentos instantaneamente. A inteligência artificial enriquecerá sua nota em segundo plano sem travar a interface."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateNote} className="space-y-4 min-w-0">
          {createNoteError && (
            <Alert variant="error">{createNoteError}</Alert>
          )}

          {/* Formato da Nota */}
          <div className="flex items-center gap-2 p-1 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] w-fit">
            <button
              type="button"
              onClick={() => setNewSourceType('text')}
              className={`px-3 py-1 text-xs rounded-[var(--radius-xs)] font-medium transition-colors ${
                newSourceType === 'text'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Texto / Ideia
            </button>
            <button
              type="button"
              onClick={() => setNewSourceType('link')}
              className={`px-3 py-1 text-xs rounded-[var(--radius-xs)] font-medium transition-colors ${
                newSourceType === 'link'
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Link / Artigo Web
            </button>
          </div>

          <FormField label="Título da Nota" required error={createNoteError ? ' ' : undefined}>
            <Input
              type="text"
              placeholder="Ex.: Hipótese sobre modelos de linguagem em edge devices"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
              className="text-xs"
            />
          </FormField>

          {newSourceType === 'link' && (
            <FormField label="URL de Origem" helperText="A IA extrairá o contexto deste link.">
              <Input
                type="url"
                placeholder="https://exemplo.com/pesquisa"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="text-xs"
              />
            </FormField>
          )}

          <FormField label="Conteúdo / Rascunho" helperText="Escreva livremente. A IA gerará síntese e tarefas automaticamente.">
            <textarea
              rows={5}
              placeholder="Digite suas observações, notas de leitura ou ideias brutas..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full min-w-0 max-w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] resize-y break-words"
            />
          </FormField>

          <FormField label="Tags Manuais (Opcional)" helperText="Separe por vírgulas. A IA também sugerirá tags adicionais.">
            <Input
              type="text"
              placeholder="pesquisa, arquitetura, sprint-1"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="text-xs"
            />
          </FormField>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewNoteModalOpen(false)}
              disabled={isSubmittingNote}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingNote || !newTitle.trim()}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white gap-1.5"
            >
              {isSubmittingNote ? (
                <>
                  <Spinner size="sm" /> Salvando...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Criar Nota Instantaneamente
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: GRAVAÇÃO DE VOZ COM PERMISSÃO E TRANSCRIÇÃO IA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAudioModalOpen}
        onClose={() => {
          audioRecorder.resetRecording();
          setIsAudioModalOpen(false);
        }}
        title="Gravação de Voz & Transcrição IA"
        description="Fale seus pensamentos. O microfone captura o áudio e o Gemini transcreve, sintetiza e extrai tarefas."
        maxWidth="lg"
      >
        <div className="space-y-4 min-w-0">
          {audioSaveError && (
            <Alert variant="error">{audioSaveError}</Alert>
          )}

          {/* Iframe Notice */}
          {audioRecorder.isIframe && audioRecorder.permissionStatus !== 'granted' && (
            <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs space-y-1.5">
              <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-[var(--accent)]" /> Dica para visualização no navegador
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Se o pop-up de permissão do microfone não abrir na pré-visualização incorporada, você pode abrir a aplicação em uma nova aba para permitir o áudio diretamente.
              </p>
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline font-medium pt-1"
              >
                Abrir em Nova Aba <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Microphone Permission Diagnostic Box */}
          <div className="p-3.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 truncate">
                <div
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    audioRecorder.permissionStatus === 'granted'
                      ? 'bg-[var(--success)] animate-pulse'
                      : audioRecorder.permissionStatus === 'denied'
                      ? 'bg-[var(--error)]'
                      : 'bg-[var(--warning)]'
                  }`}
                />
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {audioRecorder.permissionStatus === 'granted'
                    ? 'Microfone Pronto e Autorizado'
                    : audioRecorder.permissionStatus === 'denied'
                    ? 'Acesso ao Microfone Negado'
                    : 'Permissão Pendente'}
                </span>
              </div>

              {audioRecorder.permissionStatus !== 'granted' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={audioRecorder.requestPermission}
                  disabled={audioRecorder.isCheckingPermission}
                  className="text-xs h-7 px-2 shrink-0 border-[var(--accent)] text-[var(--accent)]"
                >
                  {audioRecorder.isCheckingPermission ? (
                    <Spinner size="sm" />
                  ) : (
                    'Solicitar Permissão'
                  )}
                </Button>
              )}
            </div>

            {/* Error Message with Advice */}
            {audioRecorder.error && (
              <p className="text-xs text-[var(--error)] bg-[var(--error-subtle)] p-2.5 rounded-[var(--radius-xs)] leading-relaxed break-words">
                {audioRecorder.error}
              </p>
            )}

            {/* Device Selector */}
            {audioRecorder.availableDevices.length > 1 && (
              <div className="space-y-1 min-w-0">
                <label className="text-[11px] text-[var(--text-muted)] font-medium">
                  Selecionar Entrada de Áudio:
                </label>
                <select
                  value={audioRecorder.selectedDeviceId}
                  onChange={(e) => audioRecorder.setSelectedDeviceId(e.target.value)}
                  className="w-full min-w-0 text-xs h-8 px-2 rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                >
                  {audioRecorder.availableDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Audio Equalizer & Waveform (Fluidez Orgânica) */}
            {audioRecorder.isRecording && (
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5 font-mono text-[var(--accent)] font-medium">
                    <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                    <span>Captando áudio em tempo real</span>
                  </span>
                  <span className="font-mono font-bold text-xs text-[var(--accent)]">
                    {Math.floor(audioRecorder.duration / 60)}:
                    {(audioRecorder.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Gráfico de ondas/volume de áudio (waveform) como indicador reativo único */}
                <div className="h-14 w-full bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] flex items-end justify-between px-3 py-2 gap-1 overflow-hidden">
                  {audioRecorder.frequencyBands.map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-[var(--accent)] rounded-t-xs transition-all duration-75 ease-out"
                      style={{
                        height: `${height}%`,
                        opacity: Math.max(0.35, height / 100),
                        transform: `scaleY(${Math.max(0.1, height / 100)})`,
                        transformOrigin: 'bottom',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Prévia da Gravação Concluída (Audio Player Preview) */}
            {!audioRecorder.isRecording && audioRecorder.audioUrl && (
              <div className="space-y-1.5 p-3 rounded-[var(--radius-sm)] bg-[var(--surface-hover)] border border-[var(--border)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pb-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-[var(--accent)]" /> Prévia do Áudio Capturado:
                  </span>
                  <span className="font-mono text-[10px]">
                    Duração: {Math.floor(audioRecorder.duration / 60)}:
                    {(audioRecorder.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <audio
                  controls
                  src={audioRecorder.audioUrl}
                  className="w-full h-8 outline-none"
                  preload="metadata"
                />
              </div>
            )}
          </div>

          {/* Optional Audio Note Title */}
          <FormField label="Título da Gravação (Opcional)">
            <Input
              type="text"
              placeholder="Ex.: Reunião de alinhamento ou Ideia sobre pesquisa"
              value={audioNoteTitle}
              onChange={(e) => setAudioNoteTitle(e.target.value)}
              className="text-xs"
            />
          </FormField>

          {/* Recording Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              {!audioRecorder.isRecording ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={audioRecorder.startRecording}
                  disabled={isSavingAudio}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white gap-1.5"
                >
                  <Mic className="h-3.5 w-3.5" />
                  {audioRecorder.audioBlob ? 'Gravar Novamente' : 'Iniciar Gravação'}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={audioRecorder.stopRecording}
                    disabled={isSavingAudio}
                    className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Radio className="h-3.5 w-3.5 animate-pulse" /> Pausar Gravação
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveAudioNote}
                    disabled={isSavingAudio || audioRecorder.duration < 1}
                    className="bg-[var(--success)] hover:bg-green-700 text-white gap-1.5"
                  >
                    {isSavingAudio ? (
                      <>
                        <Spinner size="sm" /> Persistindo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Concluir e Salvar
                      </>
                    )}
                  </Button>
                </>
              )}

              {audioRecorder.audioBlob && !audioRecorder.isRecording && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={audioRecorder.resetRecording}
                  disabled={isSavingAudio}
                  className="text-xs text-[var(--text-muted)]"
                >
                  Descartar Áudio
                </Button>
              )}
            </div>

            {/* Botão de Salvar pós-finalização */}
            {audioRecorder.audioBlob && !audioRecorder.isRecording && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAudioNote}
                disabled={isSavingAudio}
                className="bg-[var(--success)] hover:bg-green-700 text-white gap-1.5"
              >
                {isSavingAudio ? (
                  <>
                    <Spinner size="sm" /> Salvando & Transcrevendo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Salvar & Transcrever com IA
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: DETALHES E EDIÇÃO DA NOTA */}
      {/* ========================================================================= */}
      {selectedNote && (() => {
        const modalUrl = getNoteLink(selectedNote);

        return (
          <Modal
            isOpen={Boolean(selectedNote)}
            onClose={() => setSelectedNote(null)}
            title={isEditingNote ? 'Editar Nota' : cleanNoteTitle(selectedNote.title)}
            description={
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
                  <span>Criada em {new Date(selectedNote.createdAt).toLocaleString('pt-BR')}</span>
                  {selectedNote.tags && selectedNote.tags.length > 0 && (
                    <>
                      <span className="text-[var(--text-muted)] opacity-60">·</span>
                      <div className="inline-flex flex-wrap items-center gap-1">
                        {selectedNote.tags.slice(0, 6).map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center text-[10px] font-mono bg-[var(--surface-hover)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded-[var(--radius-xs)] text-[var(--text-secondary)]"
                          >
                            #{t.name}
                          </span>
                        ))}
                        {selectedNote.tags.length > 6 && (
                          <span
                            className="inline-flex items-center text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded-[var(--radius-xs)]"
                            title={selectedNote.tags.slice(6).map((t) => `#${t.name}`).join(', ')}
                          >
                            +{selectedNote.tags.length - 6}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {!isEditingNote && modalUrl && (
                  <div className="flex items-center gap-2 pt-0.5 min-w-0 flex-wrap">
                    <a
                      href={modalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-[280px] sm:max-w-md truncate transition-colors"
                      title={`Acessar artigo ou estudo: ${modalUrl}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{modalUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(modalUrl);
                        showToast('Link copiado!');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1.5 py-0.5 rounded-[var(--radius-xs)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
                      title="Copiar link"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}
              </div>
            }
            maxWidth="xl"
          >
          <div className="space-y-5 min-w-0">
            {/* Status Banner when still processing */}
            {(selectedNote.processingStatus === 'processing' || selectedNote.processingStatus === 'pending') && (
              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center gap-2.5 text-xs text-[var(--accent)] font-medium">
                <Spinner size="sm" />
                <span>A inteligência artificial está gerando a síntese e extraindo tarefas em segundo plano...</span>
              </div>
            )}

            {isLoadingNoteDetail && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-1">
                <Spinner size="sm" />
                <span>Buscando correlações conceituais...</span>
              </div>
            )}

            {isEditingNote ? (
              <div className="space-y-4 min-w-0">
                <FormField label="Título da Nota">
                  <Input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xs"
                  />
                </FormField>

                {(selectedNote.sourceType === 'link' || selectedNote.sourceUrl) && (
                  <FormField
                    label="URL do Artigo ou Estudo"
                    helperText="Link original da publicação científica, artigo ou estudo indexado."
                  >
                    <Input
                      type="url"
                      value={editSourceUrl}
                      onChange={(e) => setEditSourceUrl(e.target.value)}
                      placeholder="https://exemplo.com/artigo"
                      className="text-xs font-mono"
                    />
                  </FormField>
                )}

                <FormField label="Conteúdo">
                  <textarea
                    rows={8}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-w-0 max-w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] resize-y break-words"
                  />
                </FormField>

                {/* Seção de Tags com Limite e Gerenciamento Interativo */}
                <FormField
                  label={`Tags (${editTags.length}/${MAX_TAGS_PER_NOTE})`}
                  helperText={
                    editTags.length >= MAX_TAGS_PER_NOTE
                      ? `Limite máximo de ${MAX_TAGS_PER_NOTE} tags atingido.`
                      : 'Digite uma nova tag ou selecione dentre as tags existentes do sistema.'
                  }
                >
                  <div className="space-y-2.5">
                    {/* Tags ativas da nota (chips limpos, sem #, com x para remoção) */}
                    {editTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] min-h-[36px]">
                        {editTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 text-xs font-sans font-medium bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] px-2 py-0.5 rounded-[var(--radius-xs)] text-[var(--text-primary)] transition-colors shadow-2xs"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditTag(tag)}
                              className="text-[var(--text-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors p-0.5 rounded-[var(--radius-xs)] cursor-pointer"
                              title={`Remover tag ${tag}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Input para nova tag + botão Adicionar */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={
                          editTags.length >= MAX_TAGS_PER_NOTE
                            ? `Limite de ${MAX_TAGS_PER_NOTE} tags atingido`
                            : 'Nova tag...'
                        }
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEditTag(newTagInput);
                          }
                        }}
                        disabled={editTags.length >= MAX_TAGS_PER_NOTE}
                        className="text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddEditTag(newTagInput)}
                        disabled={editTags.length >= MAX_TAGS_PER_NOTE || !newTagInput.trim()}
                        className="text-xs shrink-0"
                      >
                        Adicionar
                      </Button>
                    </div>

                    {/* Tags existentes do sistema para seleção rápida */}
                    {(() => {
                      const availableExistingTags = tags
                        .map((t) => t.name)
                        .filter(
                          (tagName) =>
                            !editTags.some((et) => et.toLowerCase() === tagName.toLowerCase()),
                        );

                      if (availableExistingTags.length === 0) return null;

                      return (
                        <div className="space-y-1 pt-1">
                          <div className="text-[11px] text-[var(--text-muted)] font-medium">
                            Tags disponíveis no sistema:
                          </div>
                          <div className="flex flex-wrap items-center gap-1 max-h-24 overflow-y-auto">
                            {availableExistingTags.map((tagName) => (
                              <button
                                key={tagName}
                                type="button"
                                disabled={editTags.length >= MAX_TAGS_PER_NOTE}
                                onClick={() => handleAddEditTag(tagName)}
                                className="inline-flex items-center gap-1 text-[11px] font-sans bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] px-2 py-0.5 rounded-[var(--radius-xs)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  editTags.length >= MAX_TAGS_PER_NOTE
                                    ? 'Limite máximo de tags atingido'
                                    : `Adicionar tag ${tagName}`
                                }
                              >
                                <span>+</span>
                                <span>{tagName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </FormField>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingNote(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveNoteEdit}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* AI Summary Box - Primeiro bloco de conteúdo em destaque */}
                {selectedNote.summary && (
                  <div className="p-3.5 sm:p-4 rounded-[var(--radius-sm)] bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                    <h4 className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" /> Síntese Gerada pela IA
                    </h4>
                    <p className="text-xs sm:text-sm font-normal text-stone-900 dark:text-stone-200 leading-relaxed break-words">
                      "{selectedNote.summary}"
                    </p>
                  </div>
                )}

                {/* Raw Content / Transcription */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    {selectedNote.sourceType === 'audio' ? 'Transcrição de Áudio' : 'Conteúdo Integral'}
                  </h4>
                  <div className="p-3.5 sm:p-4 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] max-h-60 overflow-y-auto text-xs sm:text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
                    {selectedNote.rawContent || 'Sem conteúdo adicional.'}
                  </div>
                </div>

                {/* Semantic Correlations (Synapses) */}
                {noteRelations.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <Network className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" /> Sinapses Conectadas ({noteRelations.length})
                    </h4>
                    <div className="space-y-2">
                      {noteRelations.map((rel) => (
                        <div
                          key={rel.id}
                          className="p-3 sm:p-3.5 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {rel.targetNoteTitle}
                            </span>
                            <span className="font-sans text-xs sm:text-sm font-medium text-[var(--accent)] shrink-0">
                              {Math.round(rel.similarityScore * 100)}% afinidade
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-sans font-normal text-[var(--text-secondary)] leading-relaxed break-words">
                            {rel.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedNote) {
                          setEditTitle(cleanNoteTitle(selectedNote.title));
                          setEditContent(selectedNote.rawContent || '');
                          setEditSourceUrl(selectedNote.sourceUrl || '');
                          setEditTags(selectedNote.tags ? selectedNote.tags.map((t) => t.name) : []);
                          setNewTagInput('');
                        }
                        setIsEditingNote(true);
                      }}
                      className="text-xs gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSelectedNote(null)}
                      className="text-xs"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
        );
      })()}

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-4 text-center text-xs text-[var(--text-muted)] shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} SynapseNotes — Segundo Cérebro com Inteligência Artificial</p>
          <p className="font-mono text-[11px]">Desenvolvido com Gemini & Express</p>
        </div>
      </footer>
    </div>
  );
}
