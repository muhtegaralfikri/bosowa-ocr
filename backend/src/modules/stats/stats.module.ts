import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { EditLog } from '../edit-logs/edit-log.entity';
import { Letter } from '../letters/letter.entity';
import { UploadedFile } from '../files/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EditLog, Letter, UploadedFile])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
