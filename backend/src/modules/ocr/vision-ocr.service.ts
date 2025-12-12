import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as fs from 'fs/promises';

@Injectable()
export class VisionOcrService {
  private readonly logger = new Logger(VisionOcrService.name);
  private client: ImageAnnotatorClient | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const credentialsPath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const apiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');

    this.logger.log(`Credentials path: ${credentialsPath || 'not set'}`);
    this.logger.log(`API key: ${apiKey ? 'set' : 'not set'}`);

    try {
      if (credentialsPath) {
        // Using service account credentials file
        this.client = new ImageAnnotatorClient({
          keyFilename: credentialsPath,
        });
        this.isConfigured = true;
        this.logger.log('Google Vision API initialized with service account');
      } else if (apiKey) {
        // Using API key
        this.client = new ImageAnnotatorClient({
          apiKey: apiKey,
        });
        this.isConfigured = true;
        this.logger.log('Google Vision API initialized with API key');
      } else {
        this.logger.warn(
          'Google Vision API not configured (no credentials found)',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google Vision API', error);
    }
  }

  isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  async recognizeText(filePath: string): Promise<string> {
    if (!this.client) {
      throw new Error('Google Vision API not configured');
    }

    try {
      this.logger.log(`Processing image with Google Vision: ${filePath}`);

      // Read the image file
      const imageBuffer = await fs.readFile(filePath);
      const imageBase64 = imageBuffer.toString('base64');

      // Call Vision API for text detection
      const [result] = await this.client.textDetection({
        image: { content: imageBase64 },
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        this.logger.warn('No text detected in image');
        return '';
      }

      // First annotation contains the full text
      const fullText = detections[0].description || '';

      this.logger.log(`Vision API extracted ${fullText.length} characters`);
      return fullText;
    } catch (error: any) {
      this.logger.error('Vision API OCR failed', error?.message || error);
      throw error;
    }
  }

  async recognizeDocument(filePath: string): Promise<string> {
    if (!this.client) {
      throw new Error('Google Vision API not configured');
    }

    try {
      this.logger.log(`Processing document with Google Vision: ${filePath}`);

      const imageBuffer = await fs.readFile(filePath);
      const imageBase64 = imageBuffer.toString('base64');

      // Use document text detection for better accuracy with documents
      const [result] = await this.client.documentTextDetection({
        image: { content: imageBase64 },
      });

      const fullTextAnnotation = result.fullTextAnnotation;

      if (!fullTextAnnotation) {
        this.logger.warn('No text detected in document');
        return '';
      }

      const fullText = fullTextAnnotation.text || '';

      this.logger.log(
        `Vision API (document mode) extracted ${fullText.length} characters`,
      );
      return fullText;
    } catch (error: any) {
      this.logger.error(
        'Vision API document OCR failed',
        error?.message || error,
      );
      throw error;
    }
  }
}
