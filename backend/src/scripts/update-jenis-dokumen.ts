import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function updateJenisDokumenEnum() {
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

  try {
    // Update the jenisDokumen enum column to include new values
    await dataSource.query(`
      ALTER TABLE letters 
      MODIFY COLUMN jenisDokumen ENUM('SURAT', 'INVOICE', 'INTERNAL_MEMO', 'PAD') NOT NULL DEFAULT 'SURAT'
    `);
    console.log('jenisDokumen enum column updated successfully');
  } catch (error: any) {
    console.error('Error updating jenisDokumen column:', error);
  }

  await dataSource.destroy();
  console.log('Update completed!');
}

updateJenisDokumenEnum().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
