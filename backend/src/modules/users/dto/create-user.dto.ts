import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../common/enums/role.enum';
import { UnitBisnis } from '../../../common/enums/unit-bisnis.enum';

export class CreateUserDto {
  @IsString({ message: 'Username harus berupa teks' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @IsString({ message: 'Password harus berupa teks' })
  @MinLength(4, { message: 'Password minimal 4 karakter' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role harus ADMIN, MANAJEMEN, atau USER' })
  role?: UserRole;

  @ValidateIf(o => o.role === UserRole.USER)
  @IsNotEmpty({ message: 'Unit bisnis wajib diisi untuk role USER' })
  @IsEnum(UnitBisnis, { message: 'Unit bisnis harus dipilih' })
  unitBisnis?: UnitBisnis;
}
