import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const SALT_ROUNDS = 10;

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 3306),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  await dataSource.initialize();
  console.log('Connected to database');

  // Create users table if not exists
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('ADMIN', 'MANAJEMEN', 'USER') DEFAULT 'USER',
      unitBisnis ENUM('BOSOWA_TAXI', 'OTORENTAL_NUSANTARA', 'OTO_GARAGE_INDONESIA', 'MALLOMO', 'LAGALIGO_LOGISTIK', 'PORT_MANAGEMENT') NULL,
      refreshToken VARCHAR(255) NULL,
      createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      updatedAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    )
  `);
  console.log('Users table ready');

  // Add unitBisnis column to letters table if not exists
  try {
    await dataSource.query(`
      ALTER TABLE letters 
      ADD COLUMN unitBisnis ENUM('BOSOWA_TAXI', 'OTORENTAL_NUSANTARA', 'OTO_GARAGE_INDONESIA', 'MALLOMO', 'LAGALIGO_LOGISTIK', 'PORT_MANAGEMENT') NOT NULL DEFAULT 'MALLOMO'
    `);
    console.log('Letters table updated with unitBisnis column');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('unitBisnis column already exists in letters table');
    } else {
      throw error;
    }
  }

  const users = [
    // Admin
    { username: 'admin', password: 'admin123', role: 'ADMIN' },
    // Manajemen (7 orang yang bisa TTD)
    { username: 'hamza', password: 'hamza123', role: 'MANAJEMEN' },
    { username: 'firdaus', password: 'firdaus123', role: 'MANAJEMEN' },
    { username: 'idris', password: 'idris123', role: 'MANAJEMEN' },
    { username: 'salahuddin', password: 'salahuddin123', role: 'MANAJEMEN' },
    { username: 'syamsul', password: 'syamsul123', role: 'MANAJEMEN' },
    { username: 'syamsuddin', password: 'syamsuddin123', role: 'MANAJEMEN' },
    { username: 'herman', password: 'herman123', role: 'MANAJEMEN' },
    // User biasa dengan unit bisnis
    { username: 'user_mallomo', password: 'user123', role: 'USER', unitBisnis: 'MALLOMO' },
    { username: 'user_bosowa', password: 'user123', role: 'USER', unitBisnis: 'BOSOWA_TAXI' },
    { username: 'user_oto', password: 'user123', role: 'USER', unitBisnis: 'OTORENTAL_NUSANTARA' },
    { username: 'user_garage', password: 'user123', role: 'USER', unitBisnis: 'OTO_GARAGE_INDONESIA' },
    { username: 'user_lagaligo', password: 'user123', role: 'USER', unitBisnis: 'LAGALIGO_LOGISTIK' },
    { username: 'user_port', password: 'user123', role: 'USER', unitBisnis: 'PORT_MANAGEMENT' },
    // User biasa tanpa unit bisnis (fallback)
    { username: 'user', password: 'user123', role: 'USER' },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    
    // Check if user exists
    const existing = await dataSource.query(
      'SELECT id FROM users WHERE username = ?',
      [user.username]
    );

    if (existing.length > 0) {
      // Update existing user
      if ((user as any).unitBisnis) {
        await dataSource.query(
          'UPDATE users SET password = ?, role = ?, unitBisnis = ? WHERE username = ?',
          [hashedPassword, user.role, (user as any).unitBisnis, user.username]
        );
        console.log(`Updated: ${user.username} (password: ${user.password}, unit: ${(user as any).unitBisnis})`);
      } else {
        await dataSource.query(
          'UPDATE users SET password = ?, role = ?, unitBisnis = NULL WHERE username = ?',
          [hashedPassword, user.role, user.username]
        );
        console.log(`Updated: ${user.username} (password: ${user.password})`);
      }
    } else {
      // Insert new user
      if ((user as any).unitBisnis) {
        await dataSource.query(
          'INSERT INTO users (id, username, password, role, unitBisnis, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())',
          [user.username, hashedPassword, user.role, (user as any).unitBisnis]
        );
        console.log(`Created: ${user.username} (password: ${user.password}, unit: ${(user as any).unitBisnis})`);
      } else {
        await dataSource.query(
          'INSERT INTO users (id, username, password, role, unitBisnis, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, NULL, NOW(), NOW())',
          [user.username, hashedPassword, user.role]
        );
        console.log(`Created: ${user.username} (password: ${user.password})`);
      }
    }
  }

  await dataSource.destroy();
  console.log('Seed completed!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
