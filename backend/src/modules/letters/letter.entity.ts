import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { JenisDokumenEnum, JenisSuratEnum } from './letter.types';
import { DeleteRequest } from '../delete-requests/delete-request.entity';
import { EditLog } from '../edit-logs/edit-log.entity';

@Entity({ name: 'letters' })
@Index('idx_letters_number', ['letterNumber'])
@Index('idx_letters_created', ['createdAt'])
@Index('idx_letters_jenis', ['jenisSurat', 'jenisDokumen'])
export class Letter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  letterNumber: string;

  @Column({ type: 'enum', enum: JenisSuratEnum })
  jenisSurat: JenisSuratEnum;

  @Column({ type: 'enum', enum: JenisDokumenEnum })
  jenisDokumen: JenisDokumenEnum;

  @Column({ type: 'varchar', nullable: true })
  tanggalSurat: string;

  @Column({ type: 'varchar', nullable: true })
  namaPengirim: string | null;

  @Column({ type: 'varchar', nullable: true })
  alamatPengirim: string | null;

  @Column({ type: 'varchar', nullable: true })
  teleponPengirim: string | null;

  @Column({ type: 'varchar', nullable: true })
  perihal: string | null;

  @Column({ type: 'float', default: 0 })
  totalNominal: number;

  @Column({ type: 'json', nullable: true })
  nominalList?: number[];

  @Column({ type: 'varchar', nullable: true })
  fileId?: string;

  @Column({ type: 'varchar', nullable: true })
  fileUrl?: string;

  @OneToMany(() => DeleteRequest, (request: DeleteRequest) => request.letter)
  deleteRequests?: DeleteRequest[];

  @OneToMany(() => EditLog, (log: EditLog) => log.letter)
  editLogs?: EditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
