import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeleteRequestsController } from './delete-requests.controller';
import { DeleteRequestsService } from './delete-requests.service';
import { DeleteRequest } from './delete-request.entity';
import { Letter } from '../letters/letter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeleteRequest, Letter])],
  controllers: [DeleteRequestsController],
  providers: [DeleteRequestsService],
  exports: [DeleteRequestsService],
})
export class DeleteRequestsModule {}
