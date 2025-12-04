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

  @Column()
  letterId: string;

  @ManyToOne(() => Letter, (letter) => letter.deleteRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'letterId' })
  letter: Letter;

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
