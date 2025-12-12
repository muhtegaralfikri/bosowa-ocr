import {
  IsOptional,
  IsNumber,
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SignatureAssignment {
  @IsString()
  assignedTo: string;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;

  @IsInt()
  @IsOptional()
  positionPage?: number;
}

export class CreateSignatureRequestDto {
  @IsString()
  letterId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignatureAssignment)
  assignments: SignatureAssignment[];

  @IsString()
  @IsOptional()
  notes?: string;
}
