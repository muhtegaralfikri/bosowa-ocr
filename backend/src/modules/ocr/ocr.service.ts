import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface OcrOptions {
  preprocess?: boolean;
  language?: string;
  psm?: number;
}

@Injectable()
export class OcrService {
  private readonly tesseractCmd = 'tesseract';
  private readonly ffmpegCmd = 'ffmpeg';

  private async preprocessImage(inputPath: string): Promise<string> {
    const ext = path.extname(inputPath);
    const preprocessedPath = inputPath.replace(ext, `_preprocessed${ext}`);

    try {
      await execFileAsync(this.ffmpegCmd, [
        '-i',
        inputPath,
        '-vf',
        'format=gray,eq=contrast=1.5:brightness=0.05,unsharp=5:5:1.0:5:5:0.0',
        '-y',
        preprocessedPath,
      ]);

      return preprocessedPath;
    } catch {
      return inputPath;
    }
  }

  async recognize(filePath: string, options: OcrOptions = {}): Promise<string> {
    const { preprocess = true, language = 'ind+eng', psm = 6 } = options;

    let processedPath = filePath;
    let shouldCleanup = false;

    try {
      if (preprocess) {
        const result = await this.preprocessImage(filePath);
        if (result !== filePath) {
          processedPath = result;
          shouldCleanup = true;
        }
      }

      const outBase = path.join(
        path.dirname(processedPath),
        `ocr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      );

      const args = [
        processedPath,
        outBase,
        '-l',
        language,
        '--psm',
        String(psm),
      ];

      await execFileAsync(this.tesseractCmd, args);

      const text = await fs.readFile(`${outBase}.txt`, 'utf8').catch(() => '');

      fs.unlink(`${outBase}.txt`).catch(() => null);
      if (shouldCleanup) {
        fs.unlink(processedPath).catch(() => null);
      }

      return text;
    } catch {
      if (shouldCleanup) {
        fs.unlink(processedPath).catch(() => null);
      }
      throw new InternalServerErrorException('OCR failed');
    }
  }
}
