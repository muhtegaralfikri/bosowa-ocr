import type { StorageEngine } from 'multer';

export interface StoredFileDescriptor {
  filePath: string;
  urlFull: string;
  filename: string;
}

export interface FileStorageAdapter {
  getMulterStorage(): StorageEngine;
  toStoredFile(file: Express.Multer.File): StoredFileDescriptor;
}

export const FILE_STORAGE_ADAPTER = 'FILE_STORAGE_ADAPTER';
