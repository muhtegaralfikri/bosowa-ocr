import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ password, ...rest }) => {
      void password;
      return rest;
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const user = this.usersRepo.create({
      username: dto.username,
      password: dto.password,
      role: dto.role || UserRole.SEKRETARIS,
    });
    const saved = await this.usersRepo.save(user);
    const { password, ...rest } = saved;
    void password;
    return rest;
  }
}
