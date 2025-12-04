import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { JenisDokumenEnum, JenisSuratEnum } from '../letter.types';

export class CreateLetterDto {
  @IsString()
  @IsNotEmpty()
  letterNumber: string;

  @IsEnum(JenisSuratEnum)
  jenisSurat: JenisSuratEnum;

  @IsEnum(JenisDokumenEnum)
  jenisDokumen: JenisDokumenEnum;

  @IsDateString()
  tanggalSurat: string;

  @IsString()
  @IsOptional()
  namaPengirim?: string | null;

  @IsString()
  @IsOptional()
  alamatPengirim?: string | null;

  @IsString()
  @IsOptional()
  teleponPengirim?: string | null;

  @IsString()
  @IsOptional()
  perihal?: string | null;

  @IsNumber()
  totalNominal: number;

  @IsOptional()
  @IsString()
  fileId?: string;
}
