import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditLogsController } from './edit-logs.controller';
import { EditLogsService } from './edit-logs.service';
import { EditLog } from './edit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EditLog])],
  controllers: [EditLogsController],
  providers: [EditLogsService],
  exports: [EditLogsService],
})
export class EditLogsModule {}
