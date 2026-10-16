import { EventEmitter } from 'events';

export interface QueueMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: string;
  attempts: number;
}

export type QueueHandler<T = any> = (message: QueueMessage<T>) => Promise<void>;

export class QueueAdapter {
  private emitter = new EventEmitter();
  private queue: QueueMessage[] = [];
  private handlers = new Map<string, QueueHandler[]>();
  private isProcessing = false;

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  public async publish<T>(type: string, payload: T): Promise<string> {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const message: QueueMessage<T> = {
      id,
      type,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
    };

    this.queue.push(message);
    setImmediate(() => this.processNext());
    return id;
  }

  public subscribe<T>(type: string, handler: QueueHandler<T>): void {
    const current = this.handlers.get(type) || [];
    current.push(handler);
    this.handlers.set(type, current);
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const message = this.queue.shift();
    if (message) {
      const handlers = this.handlers.get(message.type) || [];
      for (const handler of handlers) {
        try {
          message.attempts += 1;
          await handler(message);
        } catch (error) {
          console.error(`[QueueAdapter] Erro ao processar mensagem ${message.id} (${message.type}):`, error);
        }
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.processNext());
    }
  }

  public size(): number {
    return this.queue.length;
  }
}

export const queueAdapter = new QueueAdapter();
