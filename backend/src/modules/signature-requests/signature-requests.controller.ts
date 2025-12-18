import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SignatureRequestsService } from './signature-requests.service';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { SignDocumentDto } from './dto/sign-document.dto';
import { SignatureRequestStatus } from './signature-request.entity';

@Controller('signature-requests')
@UseGuards(JwtAuthGuard)
export class SignatureRequestsController {
  constructor(private readonly requestsService: SignatureRequestsService) {}

  @Get()
  findAll(@Request() req, @Query('status') status?: SignatureRequestStatus) {
    return this.requestsService.findAll(req.user.userId, status);
  }

  @Get('pending')
  findPending(@Request() req) {
    return this.requestsService.findPendingForUser(req.user.userId);
  }

  @Get('by-letter/:letterId')
  findByLetter(@Param('letterId') letterId: string, @Request() req) {
    return this.requestsService.findByLetterForUser(letterId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.requestsService.findOneForUser(id, req.user);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateSignatureRequestDto) {
    return this.requestsService.createForUser(req.user, dto);
  }

  @Put(':id/sign')
  sign(@Param('id') id: string, @Request() req, @Body() dto: SignDocumentDto) {
    return this.requestsService.sign(id, req.user.userId, dto);
  }

  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Request() req,
    @Body('notes') notes?: string,
  ) {
    return this.requestsService.reject(id, req.user.userId, notes);
  }

  @Get('shared-signed/:letterId')
  getSharedSigned(@Param('letterId') letterId: string, @Request() req) {
    return this.requestsService.getSharedSignedPathForUser(letterId, req.user);
  }
}
