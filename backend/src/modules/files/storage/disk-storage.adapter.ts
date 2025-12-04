import { Injectable } from '@nestjs/common';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { join, extname, parse } from 'node:path';
import type {
  FileStorageAdapter,
  StoredFileDescriptor,
} from './file-storage.interface';

@Injectable()
export class DiskStorageAdapter implements FileStorageAdapter {
  private readonly baseUrl =
    process.env.APP_BASE_URL || 'http://localhost:3000';

  getMulterStorage() {
    return diskStorage({
      destination: (_req, _file, cb) => {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const dest = join(process.cwd(), 'uploads', year, month);
        mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (_req, file, cb) => {
        const extension = extname(file.originalname);
        const base = parse(file.originalname).name;
        const safeName = base.replace(extension, '').replace(/[^\w\d-]/g, '_');
        const filename = `${safeName || 'file'}_${Date.now()}${extension}`;
        cb(null, filename);
      },
    });
  }

  toStoredFile(file: Express.Multer.File): StoredFileDescriptor {
    const relativePath = file.path
      .replace(process.cwd(), '')
      .replace(/^[\\/]/, '');
    const urlFull = `${this.baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    return {
      filePath: file.path,
      urlFull,
      filename: join(relativePath),
    };
  }
}
