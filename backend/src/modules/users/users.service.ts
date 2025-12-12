import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

const SALT_ROUNDS = 10;
const REFRESH_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(role?: UserRole): Promise<Omit<User, 'password'>[]> {
    const where = role ? { role } : {};
    const users = await this.usersRepo.find({ where, order: { createdAt: 'DESC' } });
    return users.map(({ password, ...rest }) => {
      void password;
      return rest;
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.usersRepo.create({
      username: dto.username,
      password: hashedPassword,
      role: dto.role || UserRole.USER,
    });
    const saved = await this.usersRepo.save(user);
    const { password, ...rest } = saved;
    void password;
    return rest;
  }

  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const saved = await this.usersRepo.save(user);
    const { password, ...rest } = saved;
    void password;
    return rest;
  }

  async delete(userId: string): Promise<void> {
    await this.usersRepo.delete(userId);
  }

  findById(userId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id: userId } });
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    if (refreshToken) {
      const hashedToken = await bcrypt.hash(refreshToken, REFRESH_SALT_ROUNDS);
      await this.usersRepo.update(userId, { refreshToken: hashedToken });
    } else {
      await this.usersRepo.update(userId, { refreshToken: null });
    }
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken) return false;
    return bcrypt.compare(refreshToken, user.refreshToken);
  }
}
