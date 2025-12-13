import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, IsDateString, IsIn, IsNumber } from 'class-validator';

export class ListLettersQueryDto {
  @IsString()
  @IsOptional()
  keyword?: string; // Search in multiple fields

  @IsString()
  @IsOptional()
  letterNumber?: string;

  @IsString()
  @IsOptional()
  namaPengirim?: string;

  @IsString()
  @IsOptional()
  perihal?: string;

  @IsIn(['SURAT', 'INVOICE'])
  @IsOptional()
  jenisDokumen?: 'SURAT' | 'INVOICE';

  @IsIn(['MASUK', 'KELUAR'])
  @IsOptional()
  jenisSurat?: 'MASUK' | 'KELUAR';

  @IsDateString()
  @IsOptional()
  tanggalMulai?: string; // YYYY-MM-DD format

  @IsDateString()
  @IsOptional()
  tanggalSelesai?: string; // YYYY-MM-DD format

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  nominalMin?: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  nominalMax?: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
