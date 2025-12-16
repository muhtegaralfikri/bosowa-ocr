import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SignatureRequest,
  SignatureRequestStatus,
} from './signature-request.entity';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { SignDocumentDto } from './dto/sign-document.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { SignaturesService } from '../signatures/signatures.service';
import { Letter } from '../letters/letter.entity';
import { User } from '../users/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class SignatureRequestsService {
  constructor(
    @InjectRepository(SignatureRequest)
    private readonly requestRepo: Repository<SignatureRequest>,
    @InjectRepository(Letter)
    private readonly letterRepo: Repository<Letter>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly signaturesService: SignaturesService,
  ) {}

  async findAll(
    userId: string,
    status?: SignatureRequestStatus,
  ): Promise<SignatureRequest[]> {
    try {
      const where: any = { requestedBy: userId };
      if (status) {
        where.status = status;
      }
      return this.requestRepo.find({
        where,
        relations: ['letter', 'assignee', 'requester'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error('findAll error:', error);
      return [];
    }
  }

  async findPendingForUser(userId: string): Promise<SignatureRequest[]> {
    try {
      return this.requestRepo.find({
        where: { assignedTo: userId, status: SignatureRequestStatus.PENDING },
        relations: ['letter', 'requester'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      console.error('findPendingForUser error:', error);
      return [];
    }
  }

  async findOne(id: string): Promise<SignatureRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['letter', 'assignee', 'requester'],
    });
    if (!request) {
      throw new NotFoundException('Signature request not found');
    }
    return request;
  }

  async findByLetter(letterId: string): Promise<SignatureRequest[]> {
    return this.requestRepo.find({
      where: { letterId },
      relations: ['assignee', 'requester'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    requestedBy: string,
    dto: CreateSignatureRequestDto,
  ): Promise<SignatureRequest[]> {
    console.log('=== CREATE SIGNATURE REQUEST ===');
    console.log('DTO assignments:', dto.assignments);
    console.log('Assignments length:', dto.assignments?.length);
    
    const letter = await this.letterRepo.findOne({
      where: { id: dto.letterId },
    });
    if (!letter) throw new NotFoundException('Letter not found');

    const results: SignatureRequest[] = [];

    for (const assignment of dto.assignments) {
      // Use TypeORM create/save (safe from SQL injection)
      const request = this.requestRepo.create({
        letterId: dto.letterId,
        requestedBy,
        assignedTo: assignment.assignedTo,
        status: SignatureRequestStatus.PENDING,
        positionX: assignment.positionX ?? null,
        positionY: assignment.positionY ?? null,
        positionPage: assignment.positionPage ?? null,
        notes: dto.notes ?? null,
      });
      const saved = await this.requestRepo.save(request);

      // Reload with relations
      const withRelations = await this.requestRepo.findOne({
        where: { id: saved.id },
        relations: ['letter'],
      });

      if (withRelations) {
        results.push(withRelations);

        // Create notification for assignee
        try {
          await this.notificationsService.create(
            assignment.assignedTo,
            NotificationType.SIGNATURE_REQUEST,
            'Permintaan Tanda Tangan',
            `Anda diminta menandatangani dokumen "${letter.letterNumber}"`,
            saved.id,
          );
        } catch (err) {
          console.error('Failed to create notification:', err);
        }
      }
    }

    return results;
  }

  async sign(
    id: string,
    userId: string,
    dto: SignDocumentDto,
  ): Promise<SignatureRequest> {
    const request = await this.findOne(id);

    if (request.assignedTo !== userId) {
      throw new ForbiddenException(
        'You are not assigned to sign this document',
      );
    }

    if (request.status !== SignatureRequestStatus.PENDING) {
      throw new BadRequestException('This request is already processed');
    }

    const signature = dto.signatureId
      ? await this.signaturesService.findOne(dto.signatureId, userId)
      : await this.signaturesService.findDefaultByUser(userId);

    if (!signature) {
      throw new BadRequestException(
        'No signature found. Please upload or draw a signature first.',
      );
    }

    const posX = dto.positionX ?? request.positionX ?? 50;
    const posY = dto.positionY ?? request.positionY ?? 50;

    // Extract relative path from fileUrl (remove http://localhost:3000 prefix)
    let documentPath = request.letter.fileUrl || '';
    if (documentPath.startsWith('http')) {
      try {
        const url = new URL(documentPath);
        documentPath = url.pathname;
      } catch {
        // Keep original path
      }
    }

    const scale = dto.scale ?? 100;
    console.log('=== EMBEDDING SIGNATURE ===');
    console.log('Document path:', documentPath);
    console.log('Letter ID:', request.letterId);
    console.log('User signing:', userId);
    
    const signedImagePath = await this.embedSignature(
      documentPath,
      signature.imagePath,
      posX,
      posY,
      request.letterId,
      scale,
    );
    
    console.log('Signed image path:', signedImagePath);

    request.status = SignatureRequestStatus.SIGNED;
    request.signedAt = new Date();
    request.signedImagePath = signedImagePath;
    request.positionX = posX;
    request.positionY = posY;

    const saved = await this.requestRepo.save(request);

    await this.notificationsService.create(
      request.requestedBy,
      NotificationType.SIGNATURE_COMPLETED,
      'Dokumen Ditandatangani',
      `Dokumen "${request.letter.letterNumber}" telah ditandatangani`,
      saved.id,
    );

    return saved;
  }

  // Get shared signed document path for a letter
  async getSharedSignedPath(letterId: string): Promise<string | null> {
    const letter = await this.letterRepo.findOne({ where: { id: letterId } });
    if (!letter) return null;
    
    const outputDir = path.join(process.cwd(), 'uploads', 'signed');
    const outputFilename = `signed-${letterId}-${path.basename(letter.fileUrl || '')}`;
    const outputPath = path.join(outputDir, outputFilename);
    
    if (fs.existsSync(outputPath)) {
      return `/uploads/signed/${outputFilename}`;
    }
    return null;
  }

  async reject(
    id: string,
    userId: string,
    notes?: string,
  ): Promise<SignatureRequest> {
    const request = await this.findOne(id);

    if (request.assignedTo !== userId) {
      throw new ForbiddenException('You are not assigned to this request');
    }

    if (request.status !== SignatureRequestStatus.PENDING) {
      throw new BadRequestException('This request is already processed');
    }

    request.status = SignatureRequestStatus.REJECTED;
    request.notes = notes ?? request.notes;

    const saved = await this.requestRepo.save(request);

    await this.notificationsService.create(
      request.requestedBy,
      NotificationType.SIGNATURE_REJECTED,
      'Permintaan Ditolak',
      `Permintaan tanda tangan untuk "${request.letter.letterNumber}" ditolak`,
      saved.id,
    );

    return saved;
  }

  private async embedSignature(
    documentPath: string,
    signaturePath: string,
    posX: number,
    posY: number,
    letterId: string,
    scale: number = 100,
  ): Promise<string> {
    const docFullPath = path.join(process.cwd(), documentPath);
    const sigFullPath = path.join(process.cwd(), signaturePath);

    if (!fs.existsSync(docFullPath) || !fs.existsSync(sigFullPath)) {
      throw new BadRequestException('Document or signature file not found');
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'signed');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use fixed filename per letter so all signatures go to same document
    const outputFilename = `signed-${letterId}-${path.basename(documentPath)}`;
    const outputPath = path.join(outputDir, outputFilename);

    // Handle PDF files
    if (documentPath.toLowerCase().endsWith('.pdf')) {
      const { PDFDocument } = await import('pdf-lib');
      
      // Check if signed document already exists
      let pdfDoc: any;
      let pages: any;
      
      if (fs.existsSync(outputPath)) {
        // Load existing signed document and add new signature
        const signedPdfBuffer = fs.readFileSync(outputPath);
        pdfDoc = await PDFDocument.load(signedPdfBuffer);
        pages = pdfDoc.getPages();
        console.log('Adding signature to existing signed document:', outputPath);
      } else {
        // Create new signed document
        const pdfBuffer = fs.readFileSync(docFullPath);
        pdfDoc = await PDFDocument.load(pdfBuffer);
        pages = pdfDoc.getPages();
        console.log('Creating new signed document:', outputPath);
      }
      
      const page = pages[0];
      const { width, height } = page.getSize();

      const sigPngBuffer = await sharp(sigFullPath).png().toBuffer();
      const sigImage = await pdfDoc.embedPng(sigPngBuffer);

      const BASE_RATIO = 0.2;
      const targetWidth = width * BASE_RATIO * (scale / 100);
      const scaleFactor = targetWidth / sigImage.width;
      const sigDims = sigImage.scale(scaleFactor);

      const x = (posX / 100) * width - sigDims.width / 2;
      const y = height - ((posY / 100) * height) - sigDims.height / 2;

      page.drawImage(sigImage, {
        x,
        y,
        width: sigDims.width,
        height: sigDims.height,
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
      
      return `/uploads/signed/${outputFilename}`;
    }

    // Handle Image files -> Convert to PDF
    const docImage = sharp(docFullPath);
    const docMetadata = await docImage.metadata();

    const BASE_RATIO = 0.2; 
    const aspectRatio = 2 / 1; 
    
    const docWidth = docMetadata.width || 800;
    const baseWidth = Math.round(docWidth * BASE_RATIO);
    const baseHeight = Math.round(baseWidth / aspectRatio);
    const sigWidth = Math.round(baseWidth * (scale / 100));
    const sigHeight = Math.round(baseHeight * (scale / 100));

    const signatureBuffer = await sharp(sigFullPath)
      .resize({ width: sigWidth, height: sigHeight, fit: 'inside' })
      .png() 
      .toBuffer();

    const x = Math.round(
      (posX / 100) * (docMetadata.width || 800) - sigWidth / 2,
    );
    const y = Math.round(
      (posY / 100) * (docMetadata.height || 600) - sigHeight / 2,
    );

    // Composite signature onto image
    const signedImageBuffer = await docImage
      .composite([
        {
          input: signatureBuffer,
          left: x,
          top: y,
        },
      ])
      .png() // Force PNG for embedding
      .toBuffer();

    // Convert to PDF
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const imageEmbed = await pdfDoc.embedPng(signedImageBuffer);
    const page = pdfDoc.addPage([imageEmbed.width, imageEmbed.height]);
    
    page.drawImage(imageEmbed, {
      x: 0,
      y: 0,
      width: imageEmbed.width,
      height: imageEmbed.height,
    });

    // Save as PDF
    const pdfOutputFilename = outputFilename.replace(path.extname(outputFilename), '.pdf');
    const pdfOutputPath = path.join(outputDir, pdfOutputFilename);
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfOutputPath, pdfBytes);

    return `/uploads/signed/${pdfOutputFilename}`;
  }
}
