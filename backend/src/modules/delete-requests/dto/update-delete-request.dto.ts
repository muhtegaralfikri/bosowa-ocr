import { IsEnum } from 'class-validator';
import { DeleteRequestStatus } from '../delete-request.entity';

export class UpdateDeleteRequestDto {
  @IsEnum(DeleteRequestStatus)
  status: DeleteRequestStatus;
}
