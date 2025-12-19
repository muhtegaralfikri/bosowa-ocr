import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { EditLogsModule } from '../edit-logs/edit-logs.module';
import { OcrModule } from '../ocr/ocr.module';
import { LettersController } from './letters.controller';
import { LettersService } from './letters.service';
import { Letter } from './letter.entity';
import { OcrPreviewQueueService } from './ocr-preview.queue';
import { OcrPreviewCacheService } from './ocr-preview-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Letter]),
    OcrModule,
    FilesModule,
    EditLogsModule,
  ],
  controllers: [LettersController],
  providers: [LettersService, OcrPreviewQueueService, OcrPreviewCacheService],
})
export class LettersModule {}
