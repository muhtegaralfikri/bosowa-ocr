import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CleanupService } from './cleanup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly cleanupService: CleanupService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file' })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    const meta = await this.filesService.registerFile(file);
    return meta;
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup orphaned files (Admin only)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async cleanup(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun === 'true';
    const result = await this.cleanupService.cleanupOrphanedFiles(isDryRun);
    return {
      message: isDryRun ? 'Dry run completed' : 'Cleanup completed',
      ...result,
      freedMB: (result.freedBytes / 1024 / 1024).toFixed(2),
    };
  }

  @Get('cleanup/preview')
  @ApiOperation({ summary: 'Preview cleanup (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async previewCleanup() {
    const result = await this.cleanupService.cleanupOrphanedFiles(true);
    return {
      message: 'Preview - no files deleted',
      ...result,
      freedMB: (result.freedBytes / 1024 / 1024).toFixed(2),
    };
  }
}
