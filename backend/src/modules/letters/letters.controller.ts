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
import { ILike } from 'typeorm';
import { Request as ExpressRequest } from 'express';
import { CreateLetterDto } from './dto/create-letter.dto';
import { OcrPreviewDto } from './dto/ocr-preview.dto';
import { ListLettersQueryDto } from './dto/list-letters-query.dto';
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
  findAll(@Query() query: ListLettersQueryDto) {
    return this.lettersService.findAll(
      query.keyword,
      query.letterNumber,
      query.namaPengirim,
      query.perihal,
      query.jenisDokumen,
      query.jenisSurat,
      query.tanggalMulai,
      query.tanggalSelesai,
      query.nominalMin,
      query.nominalMax,
      query.page,
      query.limit,
    );
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

  @Get('debug-query')
  async debugQuery(@Query() query: ListLettersQueryDto) {
    return {
      query,
      receivedParams: {
        keyword: query.keyword,
        letterNumber: query.letterNumber,
        namaPengirim: query.namaPengirim,
        perihal: query.perihal,
        jenisDokumen: query.jenisDokumen,
        jenisSurat: query.jenisSurat,
        tanggalMulai: query.tanggalMulai,
        tanggalSelesai: query.tanggalSelesai,
        nominalMin: query.nominalMin,
        nominalMax: query.nominalMax,
        page: query.page,
        limit: query.limit,
      },
      message: 'Debug endpoint - all parameters received successfully'
    };
  }
}
