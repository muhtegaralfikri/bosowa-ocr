import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UploadedFile } from './file.entity';

@Module({
  imports: [
    MulterModule.register({ dest: join(process.cwd(), 'uploads') }),
    TypeOrmModule.forFeature([UploadedFile]),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
