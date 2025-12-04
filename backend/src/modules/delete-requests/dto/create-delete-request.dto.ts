import { IsOptional, IsString } from 'class-validator';

export class CreateDeleteRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
