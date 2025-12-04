import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CreateLetterDto } from './dto/create-letter.dto';
import { OcrPreviewDto } from './dto/ocr-preview.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { LettersService } from './letters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('letters')
@UseGuards(JwtAuthGuard)
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Post('ocr-preview')
  ocrPreview(@Body() dto: OcrPreviewDto) {
    return this.lettersService.previewOcr(dto);
  }

  @Post()
  create(@Body() dto: CreateLetterDto) {
    return this.lettersService.create(dto);
  }

  @Get()
  findAll(@Query('letterNumber') letterNumber?: string) {
    return this.lettersService.findAll(letterNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lettersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLetterDto,
    @Request() req: ExpressRequest & { user?: { username?: string } },
  ) {
    const updatedBy = req.user?.username;
    return this.lettersService.update(id, dto, updatedBy);
  }
}
