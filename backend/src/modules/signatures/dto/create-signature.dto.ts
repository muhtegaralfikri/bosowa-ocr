import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSignatureDto {
  @IsString()
  @IsOptional()
  imagePath?: string;

  @IsString()
  @IsOptional()
  base64Image?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isDefault?: boolean;
}
