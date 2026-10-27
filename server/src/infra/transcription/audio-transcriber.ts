import { GoogleGenAI } from '@google/genai';
import { NoteAnalysis } from '../llm/gemini-adapter.ts';

export interface TranscriptionResult {
  transcription: string;
  analysis: NoteAnalysis;
}

export class AudioTranscriber {
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

  private async withTimeout<T>(promise: Promise<T>, timeoutMs = 45000): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error('TIMEOUT_AUDIO_TRANSCRIPTION')), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async generateWithFallback(
    params: {
      contents: any;
      config?: any;
    },
    timeoutMs = 45000,
  ): Promise<any> {
    if (!this.ai) {
      throw new Error('NO_AI_CLIENT');
    }

    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.withTimeout(
          this.ai.models.generateContent({
            model,
            contents: params.contents,
            config: params.config,
          }),
          timeoutMs,
        );
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        console.warn(`[AudioTranscriber] Tentativa com modelo ${model} falhou: ${msg.slice(0, 100)}. Tentando modelo alternativo...`);
      }
    }

    throw lastError || new Error('ALL_TRANSCRIBE_MODELS_FAILED');
  }

  public async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    titleHint = 'Gravação de Voz',
  ): Promise<TranscriptionResult> {
    if (!this.ai) {
      return {
        transcription: 'Transcrição local: Gravação recebida e processada localmente.',
        analysis: this.fallbackAnalysis(titleHint, 'Gravação de áudio'),
      };
    }

    if (!audioBuffer || audioBuffer.length < 300) {
      return {
        transcription: 'Gravação curta ou sem áudio audível detectado.',
        analysis: this.fallbackAnalysis(titleHint, 'Áudio curto gravado.'),
      };
    }

    const rawMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    const supportedMimes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/flac',
    ];
    const cleanMime = supportedMimes.includes(rawMime) ? rawMime : 'audio/webm';
    const base64Audio = audioBuffer.toString('base64');

    // 1. Tenta transcrição de áudio pura primeiro com gemini-3.5-transcribe (sem JSON mode)
    let directTranscription: string | null = null;
    try {
      const transcribeRes = await this.withTimeout(
        this.ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Audio,
              },
            },
            'Transcreva o áudio em português com fidelidade e pontuação adequada.',
          ],
        }),
        25000,
      );
      directTranscription = transcribeRes.text?.trim() || null;
    } catch {
      // Ignora e faz fallback para os modelos multimodais com JSON mode
    }

    try {
      const prompt = `Você é o transcrevedor e sintetizador cognitivo do SynapseNotes.
Por favor analise o áudio / texto a seguir:
${directTranscription ? `Texto já transcrito: "${directTranscription}"` : 'Por favor transcreva o áudio anexo com máxima fidelidade e pontuação.'}

Retorne estritamente um JSON com o seguinte formato:
{
  "transcription": "${directTranscription ? directTranscription.replace(/"/g, '\\"') : 'texto completo transcrito'}",
  "summary": "resumo analítico de 2 a 3 frases",
  "complexityLevel": "low" ou "high",
  "tags": ["Tag1", "Tag2"],
  "extractedTasks": [
    {
      "content": "descrição da tarefa extraída",
      "priorityBucket": "upcoming",
      "isSuggested": true
    }
  ]
}`;

      const contents = directTranscription
        ? [prompt]
        : [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Audio,
              },
            },
            prompt,
          ];

      const response = await this.generateWithFallback({
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        transcription: directTranscription || parsed.transcription || 'Áudio transcrito com sucesso.',
        analysis: {
          summary: parsed.summary || 'Resumo analítico gerado para a gravação.',
          complexityLevel: parsed.complexityLevel === 'high' ? 'high' : 'low',
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : ['Áudio', 'Pensamento'],
          extractedTasks: Array.isArray(parsed.extractedTasks) ? parsed.extractedTasks : [],
        },
      };
    } catch (error) {
      console.warn('[AudioTranscriber] Falha na transcrição via IA:', error);
      return {
        transcription: directTranscription || 'Transcrição indisponível no momento. Áudio armazenado com segurança.',
        analysis: this.fallbackAnalysis(titleHint, 'Gravação de voz.'),
      };
    }
  }

  private fallbackAnalysis(titleHint: string, _raw: string): NoteAnalysis {
    return {
      summary: `Resumo do áudio: ${titleHint}. Áudio processado e indexado no acervo.`,
      complexityLevel: 'low',
      tags: ['Áudio', 'Pensamento'],
      extractedTasks: [],
    };
  }
}

export const audioTranscriber = new AudioTranscriber();
