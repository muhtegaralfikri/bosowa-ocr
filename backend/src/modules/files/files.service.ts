import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { UploadedFile } from './file.entity';

export interface UploadedFileMeta {
  fileId: string;
  filePath: string;
  urlFull: string;
  filename: string;
  createdAt: Date;
}

@Injectable()
export class FilesService {
  private readonly baseUrl =
    process.env.APP_BASE_URL || 'http://localhost:3000';

  constructor(
    @InjectRepository(UploadedFile)
    private readonly filesRepo: Repository<UploadedFile>,
  ) {}

  async registerFile(filePath: string): Promise<UploadedFileMeta> {
    const relativePath = filePath
      .replace(process.cwd(), '')
      .replace(/^[\\/]/, '');
    const urlFull = `${this.baseUrl}/${relativePath.replace(/\\/g, '/')}`;

    const record = this.filesRepo.create({
      filePath,
      urlFull,
      filename: join(relativePath),
    });
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
