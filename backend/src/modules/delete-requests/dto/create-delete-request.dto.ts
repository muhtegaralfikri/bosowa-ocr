import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeleteRequestDto {
  @IsString()
  @IsNotEmpty()
  letterNumber: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
