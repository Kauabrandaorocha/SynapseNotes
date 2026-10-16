import { GoogleGenAI } from '@google/genai';
import { Note } from '../database/database-adapter.ts';

export interface ExtractedTask {
  content: string;
  priorityBucket: 'focus_today' | 'upcoming' | 'someday';
  isSuggested: boolean;
}

export interface NoteAnalysis {
  summary: string;
  complexityLevel: 'low' | 'high';
  tags: string[];
  extractedTasks: ExtractedTask[];
}

export interface NoteCorrelation {
  targetNoteId: string;
  similarityScore: number;
  reason: string;
}

export class GeminiAdapter {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_GEMINI_API')), timeoutMs),
      ),
    ]);
  }

  public async analyzeTextNote(title: string, content: string): Promise<NoteAnalysis> {
    if (!this.ai) {
      return this.fallbackAnalysis(title, content);
    }

    try {
      const prompt = `Você é o motor de inteligência do SynapseNotes, um segundo cérebro para estudantes e pesquisadores.
Analise a seguinte anotação e retorne estritamente um objeto JSON com o formato:
{
  "summary": "uma síntese analítica concisa e elegante de 2 a 3 frases capturando a tese principal",
  "complexityLevel": "low" ou "high" (use high se o texto for denso, acadêmico ou tiver múltiplas ramificações),
  "tags": ["Tag1", "Tag2"], (máximo de 3 tags conceituais em português, sem hashtag)
  "extractedTasks": [
    {
      "content": "descrição da ação concreta a ser executada",
      "priorityBucket": "focus_today" ou "upcoming",
      "isSuggested": true
    }
  ]
}

Regras inegociáveis:
- Apenas retorne JSON válido sem blocos markdown extras ou explicações adicionais.
- Para extractedTasks, se houver compromissos, leituras pendentes ou prazos no texto, extraia-os. Se não houver, retorne array vazio.
- Seja objetivo e acadêmico.

Título: ${title}
Conteúdo:
<untrusted_input>
${content}
</untrusted_input>`;

      const response = await this.withTimeout(
        this.ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        15000,
      );

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      return {
        summary: parsed.summary || 'Síntese gerada automaticamente para o acervo.',
        complexityLevel: parsed.complexityLevel === 'high' ? 'high' : 'low',
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : ['Estudos'],
        extractedTasks: Array.isArray(parsed.extractedTasks) ? parsed.extractedTasks : [],
      };
    } catch (error) {
      console.warn('[GeminiAdapter] Falha na análise de texto via IA, usando fallback local:', error);
      return this.fallbackAnalysis(title, content);
    }
  }

  public async findSynapticRelations(
    currentNote: Note,
    existingNotes: Note[],
  ): Promise<NoteCorrelation[]> {
    if (!this.ai || existingNotes.length === 0) {
      return this.fallbackRelations(currentNote, existingNotes);
    }

    try {
      const candidates = existingNotes
        .filter((n) => n.id !== currentNote.id)
        .slice(0, 12)
        .map((n) => ({
          id: n.id,
          title: n.title,
          summary: n.summary || n.rawContent.slice(0, 150),
          tags: n.tags.map((t) => t.name),
        }));

      if (candidates.length === 0) return [];

      const prompt = `Como motor sináptico do SynapseNotes, avalie se a nova nota tem conexão conceitual profunda com alguma das notas existentes no acervo.
Nova nota:
- Título: ${currentNote.title}
- Síntese: ${currentNote.summary || currentNote.rawContent.slice(0, 200)}
- Tags: ${currentNote.tags.map((t) => t.name).join(', ')}

Notas candidatas:
${JSON.stringify(candidates, null, 2)}

Se encontrar correlação relevante (similarityScore >= 0.70), retorne uma lista de até 2 correlações no formato JSON:
{
  "correlations": [
    {
      "targetNoteId": "id-da-nota-alvo",
      "similarityScore": 0.85,
      "reason": "Explicação sintética de 1 frase do porquê esses conceitos se conectam"
    }
  ]
}
Se não houver correlação forte, retorne {"correlations": []}.
Retorne estritamente JSON.`;

      const response = await this.withTimeout(
        this.ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        15000,
      );

      const parsed = JSON.parse(response.text || '{}');
      return Array.isArray(parsed.correlations) ? parsed.correlations : [];
    } catch (error) {
      console.warn('[GeminiAdapter] Falha ao correlacionar notas via IA:', error);
      return this.fallbackRelations(currentNote, existingNotes);
    }
  }

  private fallbackAnalysis(title: string, content: string): NoteAnalysis {
    const isHigh = content.length > 500;
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    return {
      summary: `Resumo analítico: ${cleanTitle}. A anotação condensa tópicos fundamentais e reflexões para estudos continuados.`,
      complexityLevel: isHigh ? 'high' : 'low',
      tags: ['Ideias', 'Estudos'],
      extractedTasks: [],
    };
  }

  private fallbackRelations(currentNote: Note, existingNotes: Note[]): NoteCorrelation[] {
    const currentTags = new Set(currentNote.tags.map((t) => t.name.toLowerCase()));
    const match = existingNotes.find(
      (n) => n.id !== currentNote.id && n.tags.some((t) => currentTags.has(t.name.toLowerCase())),
    );

    if (match) {
      return [
        {
          targetNoteId: match.id,
          similarityScore: 0.78,
          reason: 'Notas compartilham tópicos ou conceitos comuns.',
        },
      ];
    }
    return [];
  }
}

export const geminiAdapter = new GeminiAdapter();
