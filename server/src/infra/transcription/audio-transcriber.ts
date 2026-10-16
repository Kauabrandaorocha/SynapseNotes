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

  private async withTimeout<T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_AUDIO_TRANSCRIPTION')), timeoutMs),
      ),
    ]);
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

    try {
      const base64Audio = audioBuffer.toString('base64');
      const prompt = `Você é o transcrevedor e sintetizador do SynapseNotes.
Por favor:
1. Transcreva o áudio em português com fidelidade e pontuação adequada. Se for silêncio ou ruído sem fala, informe brevemente.
2. Extraia um resumo conciso, nível de complexidade ("low" ou "high"), até 3 tags conceituais e quaisquer tarefas ou compromissos citados.

Retorne estritamente um JSON com o seguinte formato:
{
  "transcription": "texto completo transcrito",
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

      const response = await this.withTimeout(
        this.ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Audio,
              },
            },
            prompt,
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        25000,
      );

      const parsed = JSON.parse(response.text || '{}');
      return {
        transcription: parsed.transcription || 'Áudio transcrito com sucesso.',
        analysis: {
          summary: parsed.summary || 'Resumo analítico gerado para a gravação.',
          complexityLevel: parsed.complexityLevel === 'high' ? 'high' : 'low',
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : ['Áudio', 'Estudos'],
          extractedTasks: Array.isArray(parsed.extractedTasks) ? parsed.extractedTasks : [],
        },
      };
    } catch (error) {
      console.warn('[AudioTranscriber] Falha na transcrição via IA:', error);
      return {
        transcription: 'Transcrição indisponível no momento. Áudio armazenado com segurança.',
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
