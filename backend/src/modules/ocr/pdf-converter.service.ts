import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

// pdf-poppler types
interface PdfInfo {
  pages: number;
}

@Injectable()
export class PdfConverterService {
  private readonly logger = new Logger(PdfConverterService.name);

  /**
   * Check if a file is a PDF based on extension
   */
  isPdf(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.pdf');
  }

  /**
   * Convert PDF to images (one per page)
   * Returns array of image file paths
   */
  async convertToImages(pdfPath: string): Promise<string[]> {
    // Dynamic import for pdf-poppler (CommonJS module)
    const pdfPoppler = await import('pdf-poppler');

    const pdfDir = path.dirname(pdfPath);
    const pdfName = path.basename(pdfPath, '.pdf');
    const outputDir = path.join(pdfDir, `${pdfName}_pages`);

    // Create output directory
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPrefix = path.join(outputDir, 'page');

    try {
      // Get PDF info to know how many pages
      const info: PdfInfo = await pdfPoppler.info(pdfPath);
      this.logger.log(`PDF has ${info.pages} page(s)`);

      // Convert options
      const opts = {
        format: 'jpeg',
        out_dir: outputDir,
        out_prefix: 'page',
        page: null, // all pages
        scale: 2048, // good resolution for OCR
      };

      await pdfPoppler.convert(pdfPath, opts);

      // Collect generated image paths
      const imagePaths: string[] = [];
      for (let i = 1; i <= info.pages; i++) {
        // pdf-poppler generates files like page-1.jpg, page-2.jpg, etc.
        const imagePath = path.join(outputDir, `page-${i}.jpg`);
        if (existsSync(imagePath)) {
          imagePaths.push(imagePath);
        }
      }

      this.logger.log(`Converted PDF to ${imagePaths.length} image(s)`);
      return imagePaths;
    } catch (error: any) {
      this.logger.error('PDF conversion failed', error?.message || error);
      throw new Error(`PDF conversion failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Convert first page of PDF to image
   * Returns path to the generated image
   */
  async convertFirstPage(pdfPath: string): Promise<string> {
    const pdfPoppler = await import('pdf-poppler');
    const pdfDir = path.dirname(pdfPath);
    const pdfName = path.basename(pdfPath, '.pdf');
    const outputDir = path.join(pdfDir, `${pdfName}_preview`); // Separate dir for previews

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    try {
      const opts = {
        format: 'jpeg',
        out_dir: outputDir,
        out_prefix: 'preview',
        page: 1, // Only first page
        scale: 1024, // Moderate resolution for preview
      };

      await pdfPoppler.convert(pdfPath, opts);

      const imagePath = path.join(outputDir, 'preview-1.jpg');
      if (existsSync(imagePath)) {
        return imagePath;
      }
      throw new Error('Preview generation failed: Output file not found');
    } catch (error: any) {
      this.logger.error('PDF preview generation failed', error);
      throw error;
    }
  }

  /**
   * Clean up converted images after OCR
   */
  async cleanupImages(imagePaths: string[]): Promise<void> {
    for (const imagePath of imagePaths) {
      try {
        await fs.unlink(imagePath);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Try to remove the directory if empty
    if (imagePaths.length > 0) {
      const dir = path.dirname(imagePaths[0]);
      try {
        await fs.rmdir(dir);
      } catch {
        // Directory not empty or other error, ignore
      }
    }
  }
}
