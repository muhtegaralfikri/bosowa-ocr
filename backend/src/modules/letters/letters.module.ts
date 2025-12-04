import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '../files/files.module';
import { EditLogsModule } from '../edit-logs/edit-logs.module';
import { OcrModule } from '../ocr/ocr.module';
import { LettersController } from './letters.controller';
import { LettersService } from './letters.service';
import { Letter } from './letter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Letter]),
    OcrModule,
    FilesModule,
    EditLogsModule,
  ],
  controllers: [LettersController],
  providers: [LettersService],
})
export class LettersModule {}
