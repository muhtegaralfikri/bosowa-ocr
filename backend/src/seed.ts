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

  const users = [
    { username: 'admin', password: 'admin123', role: 'ADMIN' },
    { username: 'sekretaris', password: 'sekretaris123', role: 'SEKRETARIS' },
    { username: 'cosm', password: 'cosm123', role: 'COSM' },
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
      await dataSource.query(
        'UPDATE users SET password = ?, role = ? WHERE username = ?',
        [hashedPassword, user.role, user.username]
      );
      console.log(`Updated: ${user.username} (password: ${user.password})`);
    } else {
      // Insert new user
      await dataSource.query(
        'INSERT INTO users (id, username, password, role, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, NOW(), NOW())',
        [user.username, hashedPassword, user.role]
      );
      console.log(`Created: ${user.username} (password: ${user.password})`);
    }
  }

  await dataSource.destroy();
  console.log('Seed completed!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
