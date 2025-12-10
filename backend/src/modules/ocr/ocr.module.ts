import { Module } from '@nestjs/common';
import { AiExtractionService } from './ai-extraction.service';
import { OcrService } from './ocr.service';
import { VisionOcrService } from './vision-ocr.service';

@Module({
  providers: [OcrService, AiExtractionService, VisionOcrService],
  exports: [OcrService, AiExtractionService, VisionOcrService],
})
export class OcrModule {}
