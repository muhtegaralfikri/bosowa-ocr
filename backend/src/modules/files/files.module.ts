import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiskStorageAdapter } from './storage/disk-storage.adapter';
import { FILE_STORAGE_ADAPTER } from './storage/file-storage.interface';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UploadedFile } from './file.entity';

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
    {
      provide: FILE_STORAGE_ADAPTER,
      useClass: DiskStorageAdapter,
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
