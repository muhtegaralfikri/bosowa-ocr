import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { EditLogsService } from '../edit-logs/edit-logs.service';
import {
  calculateOcrConfidence,
  extractLetterNumber,
  extractNamaPengirim,
  extractNominalList,
  extractPerihal,
  extractTanggal,
} from '../ocr/ocr.parsers';
import { OcrService } from '../ocr/ocr.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { OcrPreviewDto } from './dto/ocr-preview.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { Letter } from './letter.entity';

@Injectable()
export class LettersService {
  constructor(
    private readonly ocrService: OcrService,
    private readonly filesService: FilesService,
    private readonly editLogsService: EditLogsService,
    @InjectRepository(Letter)
    private readonly lettersRepo: Repository<Letter>,
  ) {}

  async previewOcr(dto: OcrPreviewDto) {
    const file = await this.filesService.getFile(dto.fileId);
    const ocrRawText = await this.ocrService.recognize(file.filePath);

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
      senderConfidence,
      senderSource,
      perihal,
      nominalList,
      totalNominal,
      ocrRawText,
      ocrConfidence,
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

  async findAll(letterNumber?: string, page = 1, limit = 10) {
    const safeLimit = Math.min(Math.max(limit ?? 10, 1), 100);
    const safePage = Math.max(page ?? 1, 1);
    const where = letterNumber
      ? { letterNumber: ILike(`%${letterNumber}%`) }
      : {};

    const [data, total] = await this.lettersRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pageCount: Math.ceil(total / safeLimit),
      },
    };
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
