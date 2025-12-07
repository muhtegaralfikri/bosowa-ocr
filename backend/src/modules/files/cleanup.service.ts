import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { UploadedFile } from './file.entity';
import { Letter } from '../letters/letter.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(UploadedFile)
    private readonly filesRepo: Repository<UploadedFile>,
    @InjectRepository(Letter)
    private readonly lettersRepo: Repository<Letter>,
  ) {}

  async cleanupOrphanedFiles(dryRun = false): Promise<{
    orphanedFiles: number;
    orphanedDbRecords: number;
    freedBytes: number;
  }> {
    this.logger.log('Starting file cleanup...');

    const allFiles = await this.getAllFilesRecursive(this.uploadsDir);
    this.logger.log(`Found ${allFiles.length} files in uploads/`);

    const referencedFiles = await this.getReferencedFiles();
    this.logger.log(`Found ${referencedFiles.size} files referenced in DB`);

    let orphanedCount = 0;
    let freedBytes = 0;

    for (const filePath of allFiles) {
      const relativePath = path
        .relative(this.uploadsDir, filePath)
        .replace(/\\/g, '/');

      if (!referencedFiles.has(relativePath)) {
        try {
          const stats = fs.statSync(filePath);
          freedBytes += stats.size;

          if (!dryRun) {
            fs.unlinkSync(filePath);
            this.logger.debug(`Deleted: ${relativePath}`);
          }
          orphanedCount++;
        } catch {
          this.logger.error(`Failed to process: ${relativePath}`);
        }
      }
    }

    // Cleanup empty directories
    if (!dryRun) {
      await this.cleanupEmptyDirs(this.uploadsDir);
    }

    // Cleanup orphaned DB records
    const orphanedDbRecords = await this.cleanupOrphanedDbRecords(
      allFiles,
      dryRun,
    );

    const freedMB = (freedBytes / 1024 / 1024).toFixed(2);
    this.logger.log(
      `Cleanup completed: ${orphanedCount} files (${freedMB} MB), ${orphanedDbRecords} DB records`,
    );

    return {
      orphanedFiles: orphanedCount,
      orphanedDbRecords,
      freedBytes,
    };
  }

  private async getReferencedFiles(): Promise<Set<string>> {
    const referencedPaths = new Set<string>();

    // Get fileUrls from letters
    const letters = await this.lettersRepo.find({
      where: { fileUrl: Not(IsNull()) },
      select: ['fileUrl'],
    });

    for (const letter of letters) {
      if (letter.fileUrl) {
        const relativePath = letter.fileUrl.replace(/^\/uploads\//, '');
        referencedPaths.add(relativePath);
      }
    }

    // Get filePaths from files table
    const files = await this.filesRepo.find({ select: ['filePath'] });
    for (const file of files) {
      if (file.filePath) {
        referencedPaths.add(file.filePath);
      }
    }

    return referencedPaths;
  }

  private async getAllFilesRecursive(dir: string): Promise<string[]> {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...(await this.getAllFilesRecursive(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async cleanupOrphanedDbRecords(
    existingFiles: string[],
    dryRun: boolean,
  ): Promise<number> {
    const existingSet = new Set(existingFiles);
    const allDbFiles = await this.filesRepo.find();

    let orphanedCount = 0;

    for (const dbFile of allDbFiles) {
      const fullPath = path.join(this.uploadsDir, dbFile.filePath);
      if (!existingSet.has(fullPath)) {
        if (!dryRun) {
          await this.filesRepo.delete(dbFile.id);
          this.logger.debug(`Deleted DB record: ${dbFile.id}`);
        }
        orphanedCount++;
      }
    }

    return orphanedCount;
  }

  private async cleanupEmptyDirs(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        await this.cleanupEmptyDirs(fullPath);
      }
    }

    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0 && dir !== this.uploadsDir) {
      fs.rmdirSync(dir);
      this.logger.debug(
        `Removed empty dir: ${path.relative(this.uploadsDir, dir)}`,
      );
    }
  }
}
