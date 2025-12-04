import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execFileAsync = promisify(execFile);

@Injectable()
export class OcrService {
  private readonly tesseractCmd = 'tesseract';

  async recognize(filePath: string): Promise<string> {
    try {
      const outBase = path.join(
        path.dirname(filePath),
        `ocr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      );

      const args = [filePath, outBase, '-l', 'ind+eng', '--psm', '6'];

      await execFileAsync(this.tesseractCmd, args);

      const text = await fs.readFile(`${outBase}.txt`, 'utf8').catch(() => '');
      fs.unlink(`${outBase}.txt`).catch(() => null);

      return text;
    } catch {
      throw new InternalServerErrorException('OCR failed');
    }
  }
}
