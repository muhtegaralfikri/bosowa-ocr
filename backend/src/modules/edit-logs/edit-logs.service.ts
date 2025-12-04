import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditLog } from './edit-log.entity';

@Injectable()
export class EditLogsService {
  constructor(
    @InjectRepository(EditLog)
    private readonly editLogsRepo: Repository<EditLog>,
  ) {}

  addLog(
    entry: Omit<EditLog, 'id' | 'createdAt' | 'letter' | 'letterId'> & {
      letterId: string;
    },
  ) {
    const record = this.editLogsRepo.create({
      ...entry,
      letterId: entry.letterId,
    });
    return this.editLogsRepo.save(record);
  }

  findAll() {
    return this.editLogsRepo.find({ order: { createdAt: 'DESC' } });
  }
}
