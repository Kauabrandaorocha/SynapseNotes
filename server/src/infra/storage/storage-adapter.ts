import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../shared/config/env.ts';

export interface StorageFile {
  key: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export class StorageAdapter {
  private localDir: string;

  constructor() {
    this.localDir = path.resolve(process.cwd(), env.LOCAL_STORAGE_PATH || './uploads');
    if (!fs.existsSync(this.localDir)) {
      try {
        fs.mkdirSync(this.localDir, { recursive: true });
      } catch {
        // Ignora se já existir
      }
    }
  }

  public async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<StorageFile> {
    const key = `audio-${Date.now()}-${crypto.randomUUID()}-${filename}`;
    const filePath = path.join(this.localDir, key);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/api/media/${key}`;

    return {
      key,
      url: publicUrl,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  public async getPresignedUploadUrl(
    filename: string,
    _mimeType: string,
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const key = `audio-direct-${Date.now()}-${crypto.randomUUID()}-${filename}`;
    return {
      uploadUrl: `/api/media/upload?key=${key}`,
      fileKey: key,
    };
  }

  public async delete(key: string): Promise<boolean> {
    const filePath = path.join(this.localDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}

export const storageAdapter = new StorageAdapter();
