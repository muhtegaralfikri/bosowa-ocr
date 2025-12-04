import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Letter } from '../letters/letter.entity';

@Entity({ name: 'edit_logs' })
export class EditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  letterId: string;

  @ManyToOne(() => Letter, (letter) => letter.editLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'letterId' })
  letter: Letter;

  @Column()
  field: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @Column()
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
