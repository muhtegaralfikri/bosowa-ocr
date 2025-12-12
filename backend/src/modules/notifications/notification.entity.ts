import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  SIGNATURE_REQUEST = 'SIGNATURE_REQUEST',
  SIGNATURE_COMPLETED = 'SIGNATURE_COMPLETED',
  SIGNATURE_REJECTED = 'SIGNATURE_REJECTED',
}

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  referenceId: string | null;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
