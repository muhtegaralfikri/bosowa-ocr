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

  async findAll(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    // Optimized query with specific columns
    const [data, total] = await this.editLogsRepo
      .createQueryBuilder('log')
      .select([
        'log.id',
        'log.letterId',
        'log.field',
        'log.oldValue',
        'log.newValue',
        'log.updatedBy',
        'log.createdAt',
        'letter.letterNumber',
      ])
      .leftJoin('log.letter', 'letter')
      .orderBy('log.createdAt', 'DESC')
      .take(safeLimit)
      .skip((safePage - 1) * safeLimit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pageCount: Math.ceil(total / safeLimit),
      },
    };
  }

  findByLetterId(letterId: string) {
    return this.editLogsRepo.find({
      where: { letterId },
      order: { createdAt: 'DESC' },
    });
  }
}
