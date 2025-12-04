import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateDeleteRequestDto } from './dto/create-delete-request.dto';
import { UpdateDeleteRequestDto } from './dto/update-delete-request.dto';
import { DeleteRequestsService } from './delete-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class DeleteRequestsController {
  constructor(private readonly deleteRequestsService: DeleteRequestsService) {}

  @Post('delete-requests')
  create(@Body() dto: CreateDeleteRequestDto) {
    return this.deleteRequestsService.create(dto);
  }

  @Get('delete-requests')
  findAll() {
    return this.deleteRequestsService.findAll();
  }

  @Patch('delete-requests/:id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDeleteRequestDto) {
    return this.deleteRequestsService.updateStatus(id, dto);
  }
}
