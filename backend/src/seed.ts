import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { UserRole } from './common/enums/role.enum';
import { UnitBisnis } from './common/enums/unit-bisnis.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Check if admin already exists
    const existingAdmin = await usersService.findByUsername('admin');
    if (existingAdmin) {
      console.log('Admin user already exists, skipping...');
    } else {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      await usersService.create({
        username: 'admin',
        password: adminPassword,
        role: UserRole.ADMIN,
        unitBisnis: null,
      });
      console.log('Admin user created successfully (username: admin, password: admin123)');
    }

    // Check if manajemen already exists
    const existingManajemen = await usersService.findByUsername('manajemen');
    if (existingManajemen) {
      console.log('Manajemen user already exists, skipping...');
    } else {
      // Create manajemen user
      const manajemenPassword = await bcrypt.hash('admin123', 10);
      await usersService.create({
        username: 'manajemen',
        password: manajemenPassword,
        role: UserRole.MANAJEMEN,
        unitBisnis: null,
      });
      console.log('Manajemen user created successfully (username: manajemen, password: admin123)');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
