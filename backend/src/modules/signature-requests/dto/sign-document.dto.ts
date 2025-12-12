import { IsUUID, IsOptional, IsNumber, IsInt } from 'class-validator';

export class SignDocumentDto {
  @IsUUID()
  @IsOptional()
  signatureId?: string;

  @IsNumber()
  @IsOptional()
  positionX?: number;

  @IsNumber()
  @IsOptional()
  positionY?: number;

  @IsInt()
  @IsOptional()
  positionPage?: number;

  @IsNumber()
  @IsOptional()
  scale?: number; // percentage, default 100
}
