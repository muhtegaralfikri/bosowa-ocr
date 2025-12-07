import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token dari login sebelumnya' })
  @IsString({ message: 'Refresh token harus berupa string' })
  @IsNotEmpty({ message: 'Refresh token tidak boleh kosong' })
  refreshToken: string;
}
