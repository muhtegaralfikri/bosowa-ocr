import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditLog } from '../edit-logs/edit-log.entity';
import { Letter } from '../letters/letter.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(EditLog)
    private readonly editLogsRepo: Repository<EditLog>,
    @InjectRepository(Letter)
    private readonly lettersRepo: Repository<Letter>,
  ) {}

  async getInputErrorStats() {
    type InputErrorRow = { user: string; total: string };
    const raw = await this.editLogsRepo
      .createQueryBuilder('log')
      .select('log.updatedBy', 'user')
      .addSelect('COUNT(log.id)', 'total')
      .groupBy('log.updatedBy')
      .orderBy('total', 'DESC')
      .getRawMany<InputErrorRow>();

    return raw.map((row) => ({
      user: row.user,
      total: Number(row.total) || 0,
    }));
  }

  async getMonthlyLettersStats() {
    type MonthlyRow = { month: string; masuk: string; keluar: string };
    const raw = await this.lettersRepo
      .createQueryBuilder('letter')
      .select("LEFT(letter.tanggalSurat, 7)", 'month')
      .addSelect(
        "SUM(CASE WHEN letter.jenisSurat = 'MASUK' THEN 1 ELSE 0 END)",
        'masuk',
      )
      .addSelect(
        "SUM(CASE WHEN letter.jenisSurat = 'KELUAR' THEN 1 ELSE 0 END)",
        'keluar',
      )
      .where("letter.tanggalSurat IS NOT NULL")
      .andWhere("letter.tanggalSurat != ''")
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(12) // Limit to last 12 active months found
      .getRawMany<MonthlyRow>();

    return raw.map((row) => ({
      month: row.month,
      masuk: Number(row.masuk) || 0,
      keluar: Number(row.keluar) || 0,
    }));
  }

  async overview() {
    return {
      inputErrors: await this.getInputErrorStats(),
      monthlyLetters: await this.getMonthlyLettersStats(),
    };
  }
}
