import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { EditLogsService } from '../edit-logs/edit-logs.service';
import { AiExtractionService } from '../ocr/ai-extraction.service';
import {
  calculateOcrConfidence,
  extractLetterNumber,
  extractNamaPengirim,
  extractNominalList,
  extractPerihal,
  extractTanggal,
} from '../ocr/ocr.parsers';
import { OcrService } from '../ocr/ocr.service';
import { VisionOcrService } from '../ocr/vision-ocr.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { OcrPreviewDto } from './dto/ocr-preview.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { Letter } from './letter.entity';

@Injectable()
export class LettersService {
  private readonly logger = new Logger(LettersService.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly visionOcrService: VisionOcrService,
    private readonly filesService: FilesService,
    private readonly editLogsService: EditLogsService,
    private readonly aiExtractionService: AiExtractionService,
    @InjectRepository(Letter)
    private readonly lettersRepo: Repository<Letter>,
  ) {}

  async previewOcr(dto: OcrPreviewDto) {
    const file = await this.filesService.getFile(dto.fileId);

    // Use Google Vision API if available, otherwise fallback to Tesseract
    let ocrRawText: string;

    if (this.visionOcrService.isAvailable()) {
      try {
        this.logger.log('Using Google Vision API for OCR');
        ocrRawText = await this.visionOcrService.recognizeDocument(
          file.filePath,
        );
      } catch {
        this.logger.warn('Vision API failed, falling back to Tesseract');
        ocrRawText = await this.ocrService.recognize(file.filePath);
      }
    } else {
      this.logger.log('Using Tesseract for OCR (Vision API not configured)');
      ocrRawText = await this.ocrService.recognize(file.filePath);
    }

    const method = dto.extractionMethod || 'auto';

    // If user explicitly requested AI but it's not available, throw error
    if (method === 'ai' && !this.aiExtractionService.isAvailable()) {
      throw new BadRequestException(
        'AI extraction tidak tersedia. Pastikan GEMINI_API_KEY sudah diset di .env',
      );
    }

    const useAI =
      method === 'ai' ||
      (method === 'auto' && this.aiExtractionService.isAvailable());

    // Try AI extraction if requested or auto with available API
    if (useAI) {
      const aiResult =
        await this.aiExtractionService.extractFromOcrText(ocrRawText);

      // If user explicitly chose AI, always return AI result
      // If auto mode, only use AI if it found meaningful data
      const hasData =
        aiResult.letterNumber || aiResult.namaPengirim || aiResult.perihal;
      const shouldUseAiResult = method === 'ai' || hasData;

      if (shouldUseAiResult) {
        return {
          letterNumber: aiResult.letterNumber,
          candidates: aiResult.letterNumber ? [aiResult.letterNumber] : [],
          tanggalSurat: aiResult.tanggalSurat,
          namaPengirim: aiResult.namaPengirim,
          alamatPengirim: aiResult.alamatPengirim,
          teleponPengirim: aiResult.teleponPengirim,
          namaPenerima: aiResult.namaPenerima,
          senderConfidence: aiResult.confidence,
          senderSource: 'ai' as const,
          perihal: aiResult.perihal,
          nominalList: aiResult.nominalList,
          totalNominal: aiResult.totalNominal,
          ocrRawText,
          ocrConfidence: {
            overallScore:
              aiResult.confidence === 'high'
                ? 85
                : aiResult.confidence === 'medium'
                  ? 60
                  : 30,
            overallConfidence: aiResult.confidence,
            details: {
              letterNumber: aiResult.letterNumber ? 25 : 0,
              tanggalSurat: aiResult.tanggalSurat ? 20 : 0,
              namaPengirim: aiResult.namaPengirim ? 20 : 0,
              perihal: aiResult.perihal ? 15 : 0,
              textQuality: 15,
            },
          },
          extractionMethod: 'ai',
        };
      }
    }

    // Fallback to regex-based extraction
    const { letterNumber, candidates } = extractLetterNumber(ocrRawText);
    const tanggalSurat = extractTanggal(ocrRawText);
    const perihal = extractPerihal(ocrRawText);
    const { nominalList, totalNominal } = extractNominalList(ocrRawText);
    const {
      namaPengirim,
      confidence: senderConfidence,
      source: senderSource,
    } = extractNamaPengirim(ocrRawText);

    const ocrConfidence = calculateOcrConfidence({
      letterNumber,
      tanggalSurat,
      namaPengirim,
      senderConfidence,
      perihal,
      totalNominal,
      ocrRawText,
    });

    return {
      letterNumber,
      candidates,
      tanggalSurat,
      namaPengirim,
      alamatPengirim: null,
      teleponPengirim: null,
      namaPenerima: null,
      senderConfidence,
      senderSource,
      perihal,
      nominalList,
      totalNominal,
      ocrRawText,
      ocrConfidence,
      extractionMethod: 'regex',
    };
  }

  async create(dto: CreateLetterDto) {
    const meta = dto.fileId
      ? await this.filesService.getFile(dto.fileId)
      : null;

    const letter = this.lettersRepo.create({
      letterNumber: dto.letterNumber,
      jenisSurat: dto.jenisSurat,
      jenisDokumen: dto.jenisDokumen,
      tanggalSurat: dto.tanggalSurat,
      namaPengirim: dto.namaPengirim || null,
      alamatPengirim: dto.alamatPengirim || null,
      teleponPengirim: dto.teleponPengirim || null,
      perihal: dto.perihal || null,
      totalNominal: dto.totalNominal,
      nominalList: [],
      fileId: dto.fileId,
      fileUrl: meta?.urlFull,
    });

    return this.lettersRepo.save(letter);
  }

  async findAll(
    keyword?: string,
    letterNumber?: string,
    namaPengirim?: string,
    perihal?: string,
    jenisDokumen?: 'SURAT' | 'INVOICE',
    jenisSurat?: 'MASUK' | 'KELUAR',
    tanggalMulai?: string,
    tanggalSelesai?: string,
    nominalMin?: number,
    nominalMax?: number,
    page = 1,
    limit = 10
  ) {
    const safeLimit = Math.min(Math.max(limit ?? 10, 1), 100);
    const safePage = Math.max(page ?? 1, 1);
    
    // Build WHERE clause more carefully
    const where: any = {};
    
    // Specific field filters (these don't conflict with OR)
    if (letterNumber) {
      where.letterNumber = ILike(`%${letterNumber}%`);
    }
    
    if (namaPengirim) {
      where.namaPengirim = ILike(`%${namaPengirim}%`);
    }
    
    if (perihal) {
      where.perihal = ILike(`%${perihal}%`);
    }
    
    if (jenisDokumen) {
      where.jenisDokumen = jenisDokumen;
    }
    
    if (jenisSurat) {
      where.jenisSurat = jenisSurat;
    }
    
    // Date range filter
    if (tanggalMulai || tanggalSelesai) {
      const dateFilter: any = {};
      if (tanggalMulai) {
        dateFilter.$gte = tanggalMulai;
      }
      if (tanggalSelesai) {
        dateFilter.$lte = tanggalSelesai;
      }
      where.tanggalSurat = dateFilter;
    }
    
    // Nominal range filter
    if (nominalMin || nominalMax) {
      const nominalFilter: any = {};
      if (nominalMin) {
        nominalFilter.$gte = nominalMin;
      }
      if (nominalMax) {
        nominalFilter.$lte = nominalMax;
      }
      where.totalNominal = nominalFilter;
    }
    
    // Keyword search across multiple fields (simplify logic)
    if (keyword) {
      // Simple case: just keyword search
      where.OR = [
        { letterNumber: ILike(`%${keyword}%`) },
        { namaPengirim: ILike(`%${keyword}%`) },
        { perihal: ILike(`%${keyword}%`) },
      ];
    }

    // Use QueryBuilder for better OR condition support
    try {
      const queryBuilder = this.lettersRepo
        .createQueryBuilder('letter')
        .select([
          'letter.id',
          'letter.letterNumber',
          'letter.jenisSurat',
          'letter.jenisDokumen',
          'letter.tanggalSurat',
          'letter.namaPengirim',
          'letter.perihal',
          'letter.createdAt',
        ]);

      // Apply specific filters first (use LIKE for MariaDB)
      if (letterNumber) {
        queryBuilder.andWhere('letter.letterNumber LIKE :letterNumber', { 
          letterNumber: `%${letterNumber}%` 
        });
      }

      if (namaPengirim) {
        queryBuilder.andWhere('letter.namaPengirim LIKE :namaPengirim', { 
          namaPengirim: `%${namaPengirim}%` 
        });
      }

      if (perihal) {
        queryBuilder.andWhere('letter.perihal LIKE :perihal', { 
          perihal: `%${perihal}%` 
        });
      }

      if (jenisDokumen) {
        queryBuilder.andWhere('letter.jenisDokumen = :jenisDokumen', { jenisDokumen });
      }

      if (jenisSurat) {
        queryBuilder.andWhere('letter.jenisSurat = :jenisSurat', { jenisSurat });
      }

      // Date range filter
      if (tanggalMulai || tanggalSelesai) {
        if (tanggalMulai && tanggalSelesai) {
          queryBuilder.andWhere('letter.tanggalSurat BETWEEN :tanggalMulai AND :tanggalSelesai', {
            tanggalMulai,
            tanggalSelesai
          });
        } else if (tanggalMulai) {
          queryBuilder.andWhere('letter.tanggalSurat >= :tanggalMulai', { tanggalMulai });
        } else if (tanggalSelesai) {
          queryBuilder.andWhere('letter.tanggalSurat <= :tanggalSelesai', { tanggalSelesai });
        }
      }

      // Nominal range filter
      if (nominalMin || nominalMax) {
        if (nominalMin && nominalMax) {
          queryBuilder.andWhere('letter.totalNominal BETWEEN :nominalMin AND :nominalMax', {
            nominalMin,
            nominalMax
          });
        } else if (nominalMin) {
          queryBuilder.andWhere('letter.totalNominal >= :nominalMin', { nominalMin });
        } else if (nominalMax) {
          queryBuilder.andWhere('letter.totalNominal <= :nominalMax', { nominalMax });
        }
      }

      // Keyword search across multiple fields (use LIKE for MariaDB)
      if (keyword) {
        queryBuilder.andWhere(
          '(letter.letterNumber LIKE :keyword OR letter.namaPengirim LIKE :keyword OR letter.perihal LIKE :keyword OR letter.jenisSurat LIKE :keyword OR letter.jenisDokumen LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
        this.logger.log(`Keyword search: "${keyword}" - searching in letterNumber, namaPengirim, perihal, jenisSurat, jenisDokumen`);
      }

      // Order and pagination
      const [data, total] = await queryBuilder
        .orderBy('letter.createdAt', 'DESC')
        .take(safeLimit)
        .skip((safePage - 1) * safeLimit)
        .getManyAndCount();

      this.logger.log(`Query successful: found ${total} results`);

      return {
        data,
        meta: {
          total,
          page: safePage,
          limit: safeLimit,
          pageCount: Math.ceil(total / safeLimit),
        },
      };
    } catch (error: any) {
      this.logger.error(`Database query failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Search query failed');
    }
  }

  async findOne(id: string) {
    const found = await this.lettersRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Letter not found');
    }
    return found;
  }

  async update(id: string, dto: UpdateLetterDto, updatedBy?: string) {
    const existing = await this.findOne(id);
    const before = { ...existing };
    let fileUrl = existing.fileUrl;
    if (dto.fileId) {
      const file = await this.filesService.getFile(dto.fileId);
      fileUrl = file.urlFull;
    }

    const merged = this.lettersRepo.merge(existing, dto, { fileUrl });
    const saved = await this.lettersRepo.save(merged);

    if (updatedBy) {
      const changes = Object.entries(dto).filter(([field, newValue]) => {
        const oldValue = (before as Record<string, unknown>)[field];
        return (
          this.normalizeLogValue(oldValue) !== this.normalizeLogValue(newValue)
        );
      });

      await Promise.all(
        changes.map(([field, newValue]) =>
          this.editLogsService.addLog({
            letterId: saved.id,
            field,
            oldValue: this.normalizeLogValue(
              (before as Record<string, unknown>)[field],
            ),
            newValue: this.normalizeLogValue(newValue),
            updatedBy,
          }),
        ),
      );
    }

    return saved;
  }
  private normalizeLogValue(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[unserializable]';
      }
    }
    if (typeof value === 'string') return value;
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') return value.name || '[function]';
    return '[unknown]';
  }
}
