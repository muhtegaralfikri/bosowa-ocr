import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiskStorageAdapter } from './storage/disk-storage.adapter';
import { FILE_STORAGE_ADAPTER } from './storage/file-storage.interface';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UploadedFile } from './file.entity';
import { ImageProcessorService } from './image-processor.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => {
        const adapter = new DiskStorageAdapter();
        return { storage: adapter.getMulterStorage() };
      },
    }),
    TypeOrmModule.forFeature([UploadedFile]),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    ImageProcessorService,
    {
      provide: FILE_STORAGE_ADAPTER,
      useClass: DiskStorageAdapter,
    },
  ],
  exports: [FilesService, ImageProcessorService],
})
export class FilesModule {}
