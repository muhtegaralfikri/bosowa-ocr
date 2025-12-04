import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'image/bmp': [[0x42, 0x4d]],
  'image/tiff': [
    [0x49, 0x49, 0x2a, 0x00],
    [0x4d, 0x4d, 0x00, 0x2a],
  ],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Ukuran file maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe file tidak didukung. Gunakan: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (!this.validateMagicBytes(file)) {
      throw new BadRequestException(
        'File tidak valid atau rusak. Pastikan file adalah gambar/PDF asli.',
      );
    }

    return file;
  }

  private validateMagicBytes(file: Express.Multer.File): boolean {
    const signatures = MAGIC_BYTES[file.mimetype];
    if (!signatures) return true;

    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path) {
      try {
        const fd = fs.openSync(file.path, 'r');
        buffer = Buffer.alloc(16);
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);
      } catch {
        return false;
      }
    } else {
      return false;
    }

    return signatures.some((sig) =>
      sig.every((byte, index) => buffer[index] === byte),
    );
  }
}
