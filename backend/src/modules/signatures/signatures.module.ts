import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signature } from './signature.entity';
import { SignaturesService } from './signatures.service';
import { SignaturesController } from './signatures.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Signature])],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}
