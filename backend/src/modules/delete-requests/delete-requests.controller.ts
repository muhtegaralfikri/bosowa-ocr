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
import { DeleteRequestsService } from './delete-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class DeleteRequestsController {
  constructor(private readonly deleteRequestsService: DeleteRequestsService) {}

  @Post('letters/:id/delete-requests')
  create(
    @Param('id') letterNumber: string,
    @Body() dto: CreateDeleteRequestDto,
  ) {
    return this.deleteRequestsService.create(letterNumber, dto);
  }

  @Get('delete-requests')
  findAll() {
    return this.deleteRequestsService.findAll();
  }

  @Patch('delete-requests/:id/approve')
  approve(@Param('id') id: string) {
    return this.deleteRequestsService.approve(id);
  }

  @Patch('delete-requests/:id/reject')
  reject(@Param('id') id: string) {
    return this.deleteRequestsService.reject(id);
  }
}
