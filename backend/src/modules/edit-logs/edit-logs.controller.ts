import { Controller, Get, UseGuards } from '@nestjs/common';
import { EditLogsService } from './edit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('edit-logs')
@UseGuards(JwtAuthGuard)
export class EditLogsController {
  constructor(private readonly editLogsService: EditLogsService) {}

  @Get()
  findAll() {
    return this.editLogsService.findAll();
  }
}
