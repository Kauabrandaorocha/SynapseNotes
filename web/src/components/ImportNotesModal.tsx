import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Mic,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Brain,
} from 'lucide-react';
import { Modal } from './ui/modal.tsx';
import { Button } from './ui/button.tsx';
import { Spinner } from './ui/spinner.tsx';
import { api, type ApiNote } from '../services/api.ts';

interface ImportNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onNoteImported?: (note: ApiNote) => void;
  onRefreshData?: () => Promise<void>;
}

type FileCategory = 'text' | 'csv' | 'audio' | null;

interface ParsedCSVNote {
  title: string;
  content: string;
  tags: string[];
}

export function ImportNotesModal({
  isOpen,
  onClose,
  onSuccess,
  onNoteImported,
  onRefreshData,
}: ImportNotesModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState<FileCategory>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados específicos para pré-visualização
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTags, setTextTags] = useState('');

  const [csvNotes, setCsvNotes] = useState<ParsedCSVNote[]>([]);

  const [audioTitle, setAudioTitle] = useState('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa estados ao fechar ou trocar de arquivo
  const resetForm = () => {
    setSelectedFile(null);
    setFileCategory(null);
    setIsProcessing(false);
    setProcessingStatus('');
    setErrorMessage(null);
    setTextTitle('');
    setTextContent('');
    setTextTags('');
    setCsvNotes([]);
    setAudioTitle('');
    setAudioDuration(0);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetForm();
    onClose();
  };

  // Parser robusto para arquivos CSV
  const parseCSV = (rawText: string): ParsedCSVNote[] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let current = '';
    let inQuotes = false;

    // Detecta delimitador comum (; ou ,)
    const firstLine = rawText.split('\n')[0] || '';
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      const nextChar = rawText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(current.trim());
        if (row.some((c) => c.length > 0)) lines.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }
    if (current.length > 0 || row.length > 0) {
      row.push(current.trim());
      if (row.some((c) => c.length > 0)) lines.push(row);
    }

    if (lines.length === 0) return [];

    // Tenta identificar cabeçalhos
    const headers = lines[0].map((h) => h.toLowerCase());
    const hasHeader = headers.some((h) =>
      ['titulo', 'title', 'nome', 'conteudo', 'content', 'texto', 'tags', 'tarefa'].includes(h)
    );

    let titleIdx = 0;
    let contentIdx = 1;
    let tagsIdx = 2;

    if (hasHeader) {
      titleIdx = headers.findIndex((h) => ['titulo', 'title', 'nome', 'tarefa'].some((k) => h.includes(k)));
      contentIdx = headers.findIndex((h) => ['conteudo', 'content', 'texto', 'corpo', 'descricao'].some((k) => h.includes(k)));
      tagsIdx = headers.findIndex((h) => ['tag', 'tags', 'categoria', 'categorias'].some((k) => h.includes(k)));

      if (titleIdx === -1) titleIdx = 0;
      if (contentIdx === -1) contentIdx = 1;
    }

    const dataRows = hasHeader ? lines.slice(1) : lines;

    const parsed: ParsedCSVNote[] = [];
    for (const r of dataRows) {
      const title = (r[titleIdx] || '').trim();
      const content = (r[contentIdx] || '').trim();
      const rawTags = tagsIdx !== -1 && r[tagsIdx] ? r[tagsIdx] : '';

      const tags = rawTags
        ? rawTags
            .split(/[,;|]/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];

      if (title || content) {
        parsed.push({
          title: title || 'Nota Importada',
          content: content || title,
          tags,
        });
      }
    }

    return parsed;
  };

  // Identificação e pré-leitura do arquivo selecionado
  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Validação de limite de tamanho (máximo 25MB para controle de custos e tráfego)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`O arquivo selecionado possui ${(file.size / (1024 * 1024)).toFixed(1)}MB. O limite máximo é de 25MB para otimização de processamento e armazenamento na nuvem.`);
      setSelectedFile(null);
      setFileCategory(null);
      return;
    }

    // Identifica categoria
    if (['txt', 'md', 'markdown'].includes(ext)) {
      setFileCategory('text');
      try {
        const text = await file.text();
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        // Tenta pegar a primeira linha caso seja um cabeçalho Markdown (# Título)
        const firstLineMatch = text.match(/^#\s+(.+)$/m);
        const derivedTitle = firstLineMatch ? firstLineMatch[1].trim() : baseName;

        setTextTitle(derivedTitle);
        setTextContent(text);
      } catch (err: any) {
        setErrorMessage('Falha ao ler o arquivo de texto.');
      }
    } else if (ext === 'csv') {
      setFileCategory('csv');
      try {
        const text = await file.text();
        const notesParsed = parseCSV(text);
        if (notesParsed.length === 0) {
          setErrorMessage('Nenhuma nota válida foi detectada no arquivo CSV.');
          setSelectedFile(null);
          setFileCategory(null);
          return;
        }
        setCsvNotes(notesParsed);
      } catch (err: any) {
        setErrorMessage('Não foi possível processar a planilha CSV.');
      }
    } else if (['mp3', 'm4a', 'mp4', 'webm', 'wav', 'ogg', 'aac'].includes(ext)) {
      setFileCategory('audio');
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setAudioTitle(`Áudio: ${baseName}`);

      // Cria preview de áudio local
      const previewUrl = URL.createObjectURL(file);
      setAudioPreviewUrl(previewUrl);

      // Obtém duração do áudio se possível
      const audioEl = document.createElement('audio');
      audioEl.src = previewUrl;
      audioEl.onloadedmetadata = () => {
        setAudioDuration(Math.round(audioEl.duration) || 0);
      };
    } else {
      setErrorMessage(
        'Formato não suportado. Por favor, envie arquivos de Texto (.txt, .md), Planilha (.csv) ou Áudio (.mp3, .m4a, .webm, .wav).'
      );
      setSelectedFile(null);
      setFileCategory(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Helper para obter mime-type correto de áudio
  const getAudioMimeType = (file: File): string => {
    if (file.type && file.type.startsWith('audio/')) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp3':
        return 'audio/mp3';
      case 'm4a':
      case 'mp4':
        return 'audio/mp4';
      case 'wav':
        return 'audio/wav';
      case 'webm':
        return 'audio/webm';
      case 'ogg':
        return 'audio/ogg';
      case 'aac':
        return 'audio/aac';
      default:
        return 'audio/webm';
    }
  };

  // Execução da importação
  const handleConfirmImport = async () => {
    if (!selectedFile || !fileCategory) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (fileCategory === 'text') {
        setProcessingStatus('Criando nota de texto...');
        const tagsArray = textTags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        const newNote = await api.createNote({
          title: textTitle.trim() || 'Nota Importada',
          content: textContent,
          sourceType: 'text',
          tagNames: tagsArray.length > 0 ? tagsArray : undefined,
        });

        if (onNoteImported) onNoteImported(newNote);
        if (onRefreshData) await onRefreshData();
        onSuccess('Nota de texto importada com sucesso!');
        handleClose();
      } else if (fileCategory === 'csv') {
        setProcessingStatus(`Importando ${csvNotes.length} notas em lote...`);

        let countSuccess = 0;
        for (let i = 0; i < csvNotes.length; i++) {
          const item = csvNotes[i];
          setProcessingStatus(`Importando nota ${i + 1} de ${csvNotes.length}...`);
          try {
            const created = await api.createNote({
              title: item.title,
              content: item.content,
              sourceType: 'text',
              tagNames: item.tags.length > 0 ? item.tags : undefined,
            });
            if (onNoteImported && i === 0) onNoteImported(created);
            countSuccess++;
          } catch (itemErr) {
            console.warn(`[CSV Import] Erro ao importar item ${i + 1}:`, itemErr);
          }
        }

        if (onRefreshData) await onRefreshData();
        onSuccess(`${countSuccess} ${countSuccess === 1 ? 'nota importada' : 'notas importadas'} do arquivo CSV com sucesso!`);
        handleClose();
      } else if (fileCategory === 'audio') {
        setProcessingStatus('Codificando áudio e enviando para transcrição IA...');

        // Converte o arquivo de áudio para base64
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const result = reader.result as string;
            const base64Data = result.includes(',') ? result.split(',')[1] : result;
            const mimeType = getAudioMimeType(selectedFile);

            setProcessingStatus('Processando com IA (transcrição e síntese em segundo plano)...');
            const createdAudioNote = await api.createAudioNote({
              title: audioTitle.trim() || undefined,
              audioData: base64Data,
              mimeType,
              durationSeconds: audioDuration || undefined,
            });

            if (onNoteImported) onNoteImported(createdAudioNote);
            if (onRefreshData) await onRefreshData();
            onSuccess('Áudio importado com sucesso! A IA está transcrevendo e gerando tarefas em segundo plano.');
            handleClose();
          } catch (sendErr: any) {
            setIsProcessing(false);
            setErrorMessage(`Erro ao importar áudio: ${sendErr.message || 'Falha na comunicação'}`);
          }
        };

        reader.onerror = () => {
          setIsProcessing(false);
          setErrorMessage('Erro ao ler os dados do arquivo de áudio.');
        };

        reader.readAsDataURL(selectedFile);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(`Falha na importação: ${err.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-[var(--accent)]" />
          <span>Importar Notas</span>
        </div>
      }
      description="Carregue arquivos de texto (.txt, .md), planilhas (.csv) ou áudios gravados (.mp3, .m4a, .webm, .wav)."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {selectedFile ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={isProcessing}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline cursor-pointer disabled:opacity-50"
            >
              Trocar arquivo
            </button>
          ) : (
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Brain className="h-3 w-3 text-amber-500" />
              <span>Detecção automática de formato</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmImport}
              disabled={!selectedFile || isProcessing}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Spinner size="sm" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirmar Importação</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div className="p-3 rounded-[var(--radius-sm)] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Zona de Drop / Seleção de Arquivo */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[var(--radius-md)] p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[var(--accent)] bg-[var(--accent-subtle)]/40 scale-[0.99]'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]/40 bg-[var(--surface-subtle)]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              accept=".txt,.md,.markdown,.csv,.mp3,.m4a,.mp4,.webm,.wav,.ogg,.aac"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="h-12 w-12 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shadow-xs">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm">
                Suporta notas em <strong>Texto (.txt, .md)</strong>, <strong>Planilhas (.csv)</strong> e <strong>Áudios (.mp3, .m4a, .webm, .wav)</strong>.
              </p>
            </div>
          </div>
        ) : (
          /* Pré-visualização do Arquivo Selecionado */
          <div className="space-y-3.5">
            {/* Header do Arquivo Selecionado */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5 min-w-0">
                {fileCategory === 'text' && (
                  <div className="h-8 w-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
                {fileCategory === 'csv' && (
                  <div className="h-8 w-8 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                )}
                {fileCategory === 'audio' && (
                  <div className="h-8 w-8 rounded bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Mic className="h-4 w-4" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[280px] sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                    {fileCategory === 'text' && 'Documento de Texto'}
                    {fileCategory === 'csv' && `Planilha (${csvNotes.length} notas identificadas)`}
                    {fileCategory === 'audio' && 'Arquivo de Áudio'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={isProcessing}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Remover arquivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Configurações específicas para TEXTO */}
            {fileCategory === 'text' && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Título da Nota
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Título da nota"
                    className="w-full text-xs px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Tags Opcionais (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={textTags}
                    onChange={(e) => setTextTags(e.target.value)}
                    placeholder="ex: estudo, pesquisa, livro"
                    className="w-full text-xs px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Prévia do Conteúdo ({textContent.length} caracteres)
                  </label>
                  <textarea
                    rows={4}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] font-mono resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {/* Configurações específicas para CSV */}
            {fileCategory === 'csv' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="font-medium">
                    Prévia das notas a serem criadas ({csvNotes.length} no total):
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Exibindo primeiras notas
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border)] divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
                  {csvNotes.slice(0, 5).map((n, idx) => (
                    <div key={idx} className="p-2.5 text-xs">
                      <p className="font-semibold text-[var(--text-primary)]">{n.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                        {n.content}
                      </p>
                      {n.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {n.tags.map((tg, tidx) => (
                            <span
                              key={tidx}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)]"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configurações específicas para ÁUDIO */}
            {fileCategory === 'audio' && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Título do Áudio
                  </label>
                  <input
                    type="text"
                    value={audioTitle}
                    onChange={(e) => setAudioTitle(e.target.value)}
                    placeholder="Título para a transcrição"
                    className="w-full text-xs px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                {audioPreviewUrl && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Reproduzir Prévia
                    </label>
                    <audio
                      controls
                      src={audioPreviewUrl}
                      className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border)]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Status de Progresso durante a Importação */}
            {isProcessing && (
              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs flex items-center gap-2 animate-pulse">
                <Spinner size="sm" />
                <span>{processingStatus}</span>
              </div>
            )}
          </div>
        )}

        {/* Guia de Formatos & Dica de Escalabilidade na Nuvem / AWS */}
        <div className="rounded-[var(--radius-md)] p-3 bg-[var(--surface-subtle)]/70 border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <HelpCircle className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
            <span>Formatos Suportados & Otimização de Custos (AWS / Nuvem):</span>
          </div>
          <ul className="space-y-1 list-disc list-inside text-[var(--text-muted)] leading-relaxed">
            <li>
              <strong>Texto (.txt, .md):</strong> Criação instantânea de notas preservando formatação.
            </li>
            <li>
              <strong>Planilhas (.csv):</strong> Importação em lote automática com colunas de título, conteúdo e tags.
            </li>
            <li>
              <strong>Áudios (.mp3, .m4a, .webm, .wav):</strong> Formatos comprimidos como <em>MP3</em> e <em>M4A/WebM</em> consomem até <strong>90% menos banda e armazenamento S3</strong> do que WAV descompactado, reduzindo significativamente custos de nuvem e acelerando a transcrição via IA integrada.
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
