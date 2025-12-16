import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { JenisDokumenEnum, JenisSuratEnum } from '../letter.types';
import { UnitBisnis } from '../../../common/enums/unit-bisnis.enum';

export class CreateLetterDto {
  @IsString({ message: 'Nomor surat harus berupa teks' })
  @IsNotEmpty({ message: 'Nomor surat tidak boleh kosong' })
  letterNumber: string;

  @IsEnum(JenisSuratEnum, { message: 'Jenis surat harus MASUK atau KELUAR' })
  jenisSurat: JenisSuratEnum;

  @IsEnum(JenisDokumenEnum, {
    message: 'Jenis dokumen harus SURAT atau INVOICE',
  })
  jenisDokumen: JenisDokumenEnum;

  @IsEnum(UnitBisnis, { message: 'Unit bisnis harus dipilih' })
  @IsOptional()
  unitBisnis?: UnitBisnis;

  @IsDateString()
  @IsNotEmpty({ message: 'Tanggal surat tidak boleh kosong' })
  tanggalSurat: string;

  @IsString({ message: 'Nama pengirim harus berupa teks' })
  @IsOptional()
  namaPengirim?: string | null;

  @IsString({ message: 'Alamat pengirim harus berupa teks' })
  @IsOptional()
  alamatPengirim?: string | null;

  @IsString({ message: 'Telepon pengirim harus berupa teks' })
  @IsOptional()
  teleponPengirim?: string | null;

  @IsString({ message: 'Perihal harus berupa teks' })
  @IsOptional()
  perihal?: string | null;

  @IsNumber({}, { message: 'Total nominal harus berupa angka' })
  totalNominal: number;

  @IsOptional()
  @IsString({ message: 'File ID harus berupa teks' })
  fileId?: string;
}
