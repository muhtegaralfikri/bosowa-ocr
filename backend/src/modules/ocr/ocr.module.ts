import { Module } from '@nestjs/common';
import { AiExtractionService } from './ai-extraction.service';
import { OcrService } from './ocr.service';
import { PdfConverterService } from './pdf-converter.service';
import { VisionOcrService } from './vision-ocr.service';

@Module({
  providers: [OcrService, AiExtractionService, VisionOcrService, PdfConverterService],
  exports: [OcrService, AiExtractionService, VisionOcrService, PdfConverterService],
})
export class OcrModule {}

