import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Express } from 'express';
import { Repository } from 'typeorm';
import { UploadedFile } from './file.entity';
import { FILE_STORAGE_ADAPTER } from './storage/file-storage.interface';
import type { FileStorageAdapter } from './storage/file-storage.interface';

export interface UploadedFileMeta {
  fileId: string;
  filePath: string;
  urlFull: string;
  filename: string;
  createdAt: Date;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(UploadedFile)
    private readonly filesRepo: Repository<UploadedFile>,
    @Inject(FILE_STORAGE_ADAPTER)
    private readonly storageAdapter: FileStorageAdapter,
  ) {}

  async registerFile(file: Express.Multer.File): Promise<UploadedFileMeta> {
    const stored = this.storageAdapter.toStoredFile(file);
    const record = this.filesRepo.create(stored);
    const saved = await this.filesRepo.save(record);

    return {
      fileId: saved.id,
      filePath: saved.filePath,
      urlFull: saved.urlFull,
      filename: saved.filename,
      createdAt: saved.createdAt,
    };
  }

  async getFile(fileId: string): Promise<UploadedFileMeta> {
    const found = await this.filesRepo.findOne({ where: { id: fileId } });
    if (!found) {
      throw new NotFoundException('File not found. Upload terlebih dahulu');
    }
    return {
      fileId: found.id,
      filePath: found.filePath,
      urlFull: found.urlFull,
      filename: found.filename,
      createdAt: found.createdAt,
    };
  }
}
