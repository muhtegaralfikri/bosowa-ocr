import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditLogsService } from './edit-logs.service';

@Controller('edit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EditLogsController {
  constructor(private readonly editLogsService: EditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.editLogsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('letter/:letterId')
  findByLetter(@Param('letterId') letterId: string) {
    return this.editLogsService.findByLetterId(letterId);
  }
}
