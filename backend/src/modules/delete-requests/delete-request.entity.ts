import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Letter } from '../letters/letter.entity';

export enum DeleteRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'delete_requests' })
export class DeleteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  letterId: string | null;

  @ManyToOne(() => Letter, (letter) => letter.deleteRequests, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'letterId' })
  letter: Letter | null;

  @Column({
    type: 'enum',
    enum: DeleteRequestStatus,
    default: DeleteRequestStatus.PENDING,
  })
  status: DeleteRequestStatus;

  @Column({ type: 'varchar', nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
