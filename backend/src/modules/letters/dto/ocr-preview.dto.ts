import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CropDto {
  @IsIn(['AUTO', 'MANUAL'])
  mode: 'AUTO' | 'MANUAL';

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

export class OcrPreviewDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CropDto)
  crop?: CropDto;
}
