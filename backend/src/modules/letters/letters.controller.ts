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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import * as fs from 'fs';
import { join } from 'path';
import { ILike } from 'typeorm';
import { Request as ExpressRequest } from 'express';
import { CreateLetterDto } from './dto/create-letter.dto';
import { OcrPreviewDto } from './dto/ocr-preview.dto';
import { ListLettersQueryDto } from './dto/list-letters-query.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { LettersService } from './letters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('letters')
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Get(':id/download-pdf')
  async downloadAsPdf(@Param('id') id: string, @Res() res: Response) {
    const letter = await this.lettersService.findOne(id);
    if (!letter || !letter.fileId) {
       res.status(404).send('Not found');
       return;
    }
    const filePath = await this.lettersService.getFilePath(letter.fileId);
    
    // Set headers for download
    const cleanLetterNumber = (letter.letterNumber || 'document').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${cleanLetterNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (filePath.toLowerCase().endsWith('.pdf')) {
       createReadStream(filePath).pipe(res);
       return;
    }

    // Convert Image to PDF on the fly
    try {
        const { PDFDocument } = await import('pdf-lib');
        const sharp = require('sharp');
        
        const docImage = sharp(filePath);
        const metadata = await docImage.metadata();
        const buffer = await docImage.png().toBuffer();

        const pdfDoc = await PDFDocument.create();
        const imageEmbed = await pdfDoc.embedPng(buffer);
        const page = pdfDoc.addPage([imageEmbed.width, imageEmbed.height]);
        page.drawImage(imageEmbed, {
            x: 0,
            y: 0,
            width: imageEmbed.width,
            height: imageEmbed.height,
        });

        const pdfBytes = await pdfDoc.save();
        res.send(Buffer.from(pdfBytes));
    } catch (e) {
        console.error('PDF Conversion failed:', e);
        res.status(500).send('Conversion failed');
    }
  }

  @Post('signed-image-preview')
  async previewSignedImage(@Body('filename') filename: string, @Res() res: Response) {
    if (!filename) {
      res.status(400).send('Filename is required');
      return;
    }

    const filePath = join(process.cwd(), 'uploads', 'signed', filename);
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
       res.status(400).send('Invalid filename');
       return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Not found');
      return;
    }

    // Obfuscate Content-Type to bypass IDM interception for PREVIEW
    // For preview we prefer octet-stream so browser doesn't hijack, but frontend handles blob.
    // Actually frontend POST handles it.
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  @Get('signed-image-download/:filename')
  async downloadSignedImage(
    @Param('filename') filename: string, 
    @Query('downloadName') downloadName: string,
    @Res() res: Response
  ) {
    const filePath = join(process.cwd(), 'uploads', 'signed', filename);
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
       res.status(400).send('Invalid filename');
       return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Not found');
      return;
    }

    // Set headers for proper download
    const finalName = downloadName || filename;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${finalName}"`);
    
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  @Get('pdf-preview/:fileId')
  async streamPdf(@Param('fileId') fileId: string, @Res() res: Response) {
    const filePath = await this.lettersService.getFilePath(fileId);
    
    // Obfuscate Content-Type to bypass IDM interception
    // IDM monitors application/pdf, so we send as generic binary
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Stream file
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  @Get(':id/preview-image')
  async previewImage(@Param('id') id: string, @Res() res: Response) {
    const letter = await this.lettersService.findOne(id);
    if (!letter || !letter.fileId) {
      // Return 404 or maybe a default placeholder logic?
      // For now 404
      res.status(404).send('Not found');
      return;
    }

    const imagePath = await this.lettersService.getPreviewImage(letter.fileId);
    
    // Serve as image/jpeg (or infer from extension)
    res.setHeader('Content-Type', 'image/jpeg');
    const stream = createReadStream(imagePath);
    stream.pipe(res);
  }

  @Post('ocr-preview')
  @UseGuards(JwtAuthGuard)
  ocrPreview(@Body() dto: OcrPreviewDto) {
    return this.lettersService.previewOcr(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateLetterDto, @Request() req: ExpressRequest & { user?: { username?: string; role?: string; unitBisnis?: string } }) {
    console.log('=== CREATE LETTER REQUEST ===');
    console.log('Request headers:', req.headers);
    console.log('User from token:', req.user);
    console.log('Raw DTO:', dto);
    
    // Auto-fill unit bisnis for regular users
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAJEMEN' && req.user?.unitBisnis) {
      dto.unitBisnis = req.user.unitBisnis as any;
      console.log('Auto-filled unit bisnis:', req.user.unitBisnis);
    }
    
    console.log('Final DTO:', dto);
    console.log('=== END DEBUG ===');
    return this.lettersService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: ListLettersQueryDto, @Request() req: ExpressRequest & { user?: { username?: string; role?: string; unitBisnis?: string } }) {
    // Determine unit bisnis filter based on user role
    let unitBisnisFilter = query.unitBisnis;
    
    // If user is not admin or manajemen, filter by their unit bisnis
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAJEMEN' && req.user?.unitBisnis) {
      unitBisnisFilter = req.user.unitBisnis as any;
    }
    
    return this.lettersService.findAll(
      query.keyword,
      query.letterNumber,
      query.namaPengirim,
      query.perihal,
      query.jenisDokumen,
      query.jenisSurat,
      unitBisnisFilter,
      query.tanggalMulai,
      query.tanggalSelesai,
      query.nominalMin,
      query.nominalMax,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.lettersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLetterDto,
    @Request() req: ExpressRequest & { user?: { username?: string } },
  ) {
    const updatedBy = req.user?.username;
    return this.lettersService.update(id, dto, updatedBy);
  }

  @Get('debug-query')
  @UseGuards(JwtAuthGuard)
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
