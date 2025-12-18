import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiskStorageAdapter } from './storage/disk-storage.adapter';
import { FILE_STORAGE_ADAPTER } from './storage/file-storage.interface';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UploadedFile } from './file.entity';
import { ImageProcessorService } from './image-processor.service';
import { CleanupService } from './cleanup.service';
import { Letter } from '../letters/letter.entity';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => {
        const adapter = new DiskStorageAdapter();
        return {
          storage: adapter.getMulterStorage(),
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB (keep in sync with FileValidationPipe)
          },
        };
      },
    }),
    TypeOrmModule.forFeature([UploadedFile, Letter]),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    ImageProcessorService,
    CleanupService,
    {
      provide: FILE_STORAGE_ADAPTER,
      useClass: DiskStorageAdapter,
    },
  ],
  exports: [FilesService, ImageProcessorService, CleanupService],
})
export class FilesModule {}
