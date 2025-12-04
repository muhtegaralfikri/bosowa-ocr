import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: Request, file: Express.Multer.File, cb) => {
          const now = new Date();
          const year = now.getFullYear().toString();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const dest = path.join(process.cwd(), 'uploads', year, month);
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req: Request, file: Express.Multer.File, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.parse(file.originalname).name;
          const safeName = base
            .replace(ext, '')
            .replace(/[^\w\d-]/g, '_')
            .slice(0, 50);
          const filename = `${safeName || 'file'}_${Date.now()}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const filePath = file.path;
    const meta = await this.filesService.registerFile(filePath);
    return meta;
  }
}
