import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function createTestAuditLog() {
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

  const now = new Date();
  
  // Create a test letter first
  const letterResult = await dataSource.query(`
    INSERT INTO letters (
      id, letterNumber, jenisSurat, jenisDokumen, unitBisnis,
      tanggalSurat, namaPengirim, alamatPengirim, teleponPengirim,
      perihal, totalNominal, nominalList, fileId, fileUrl,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'test-audit-id',
    'TEST/123/2024',
    'MASUK',
    'SURAT', 
    'BOSOWA_TAXI',
    '2024-12-17',
    'PT Test Company',
    'Jl. Test Address',
    '021-12345678',
    'Test audit log timezone',
    1000000,
    JSON.stringify([1000000]),
    null,
    null,
    now,
    now
  ]);

  // Create audit log at 9:13 AM UTC
  const testTime = new Date('2024-12-17T09:13:00.000Z');
  
  const auditResult = await dataSource.query(`
    INSERT INTO edit_logs (
      id, letterId, field, oldValue, newValue, updatedBy, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'audit-test-id',
    'test-audit-id',
    'perihal',
    'Old value',
    'Test audit log timezone',
    testTime
  ]);

  console.log('✅ Test letter and audit log created');
  console.log(`Letter time: ${now.toISOString()}`);
  console.log(`Audit time: ${testTime.toISOString()}`);
  console.log(`Audit time (local): ${testTime.toLocaleString('id-ID')}`);

  await dataSource.destroy();
  console.log('Test audit log creation completed!');
}

createTestAuditLog().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
