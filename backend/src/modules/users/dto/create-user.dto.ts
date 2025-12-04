import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsString({ message: 'Username harus berupa teks' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @IsString({ message: 'Password harus berupa teks' })
  @MinLength(4, { message: 'Password minimal 4 karakter' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role harus ADMIN, SEKRETARIS, atau COSM' })
  role?: UserRole;
}
