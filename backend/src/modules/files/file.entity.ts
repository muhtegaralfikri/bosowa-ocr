import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'files' })
@Index('idx_files_created', ['createdAt'])
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filePath: string;

  @Column()
  urlFull: string;

  @Column()
  filename: string;

  @CreateDateColumn()
  createdAt: Date;
}
