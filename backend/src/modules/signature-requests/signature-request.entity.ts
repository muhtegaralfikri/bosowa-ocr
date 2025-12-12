import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Letter } from '../letters/letter.entity';

export enum SignatureRequestStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'signature_requests' })
export class SignatureRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  letterId: string;

  @ManyToOne(() => Letter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'letterId' })
  letter: Letter;

  @Column()
  requestedBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestedBy' })
  requester: User;

  @Column()
  assignedTo: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignedTo' })
  assignee: User;

  @Column({
    type: 'enum',
    enum: SignatureRequestStatus,
    default: SignatureRequestStatus.PENDING,
  })
  status: SignatureRequestStatus;

  @Column({ type: 'float', nullable: true })
  positionX: number | null;

  @Column({ type: 'float', nullable: true })
  positionY: number | null;

  @Column({ type: 'int', nullable: true })
  positionPage: number | null;

  @Column({ type: 'datetime', nullable: true })
  signedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  signedImagePath: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
