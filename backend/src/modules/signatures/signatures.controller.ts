import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SignaturesService } from './signatures.service';
import { CreateSignatureDto } from './dto/create-signature.dto';

@Controller('signatures')
@UseGuards(JwtAuthGuard)
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Get()
  findAll(@Request() req) {
    return this.signaturesService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.signaturesService.findOne(id, req.user.userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Request() req,
    @Body() dto: CreateSignatureDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.signaturesService.create(req.user.userId, dto, file);
  }

  @Post('draw')
  draw(@Request() req, @Body() dto: CreateSignatureDto) {
    return this.signaturesService.create(req.user.userId, dto);
  }

  @Put(':id/default')
  setDefault(@Param('id') id: string, @Request() req) {
    return this.signaturesService.setDefault(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.signaturesService.remove(id, req.user.userId);
  }
}
