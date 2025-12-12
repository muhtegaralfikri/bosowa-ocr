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
import * as crypto from 'crypto';
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

  async findAll(userId: string, status?: SignatureRequestStatus): Promise<SignatureRequest[]> {
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
    const letter = await this.letterRepo.findOne({ where: { id: dto.letterId } });
    if (!letter) throw new NotFoundException('Letter not found');

    const results: SignatureRequest[] = [];

    for (const assignment of dto.assignments) {
      const id = crypto.randomUUID();
      const posX = assignment.positionX ?? 'NULL';
      const posY = assignment.positionY ?? 'NULL';
      const posPage = assignment.positionPage ?? 'NULL';
      const notes = dto.notes ? `'${dto.notes}'` : 'NULL';
      const sql = `INSERT INTO signature_requests (id, letterId, requestedBy, assignedTo, status, positionX, positionY, positionPage, notes, createdAt, updatedAt) VALUES ('${id}', '${dto.letterId}', '${requestedBy}', '${assignment.assignedTo}', 'PENDING', ${posX}, ${posY}, ${posPage}, ${notes}, NOW(), NOW())`;
      await this.requestRepo.query(sql);
      const saved = await this.requestRepo.findOne({ 
        where: { id },
        relations: ['letter'],
      });
      if (saved) {
        results.push(saved);
        
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
          console.error('Failed to create notification:', err.message);
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
      throw new ForbiddenException('You are not assigned to sign this document');
    }

    if (request.status !== SignatureRequestStatus.PENDING) {
      throw new BadRequestException('This request is already processed');
    }

    let signature = dto.signatureId
      ? await this.signaturesService.findOne(dto.signatureId, userId)
      : await this.signaturesService.findDefaultByUser(userId);

    if (!signature) {
      throw new BadRequestException('No signature found. Please upload or draw a signature first.');
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
    const signedImagePath = await this.embedSignature(
      documentPath,
      signature.imagePath,
      posX,
      posY,
      scale,
    );

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

  async reject(id: string, userId: string, notes?: string): Promise<SignatureRequest> {
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

    const outputFilename = `signed-${Date.now()}-${path.basename(documentPath)}`;
    const outputPath = path.join(outputDir, outputFilename);

    const docImage = sharp(docFullPath);
    const docMetadata = await docImage.metadata();

    // Calculate signature size based on scale (100% = 150x75)
    const baseWidth = 150;
    const baseHeight = 75;
    const sigWidth = Math.round(baseWidth * (scale / 100));
    const sigHeight = Math.round(baseHeight * (scale / 100));

    const signatureBuffer = await sharp(sigFullPath)
      .resize({ width: sigWidth, height: sigHeight, fit: 'inside' })
      .png() // Ensure PNG format with transparency
      .toBuffer();

    // Offset by half signature size to match frontend's translate(-50%, -50%) centering
    const x = Math.round((posX / 100) * (docMetadata.width || 800) - sigWidth / 2);
    const y = Math.round((posY / 100) * (docMetadata.height || 600) - sigHeight / 2);

    await docImage
      .composite([
        {
          input: signatureBuffer,
          left: x,
          top: y,
        },
      ])
      .toFile(outputPath);

    return `/uploads/signed/${outputFilename}`;
  }
}
