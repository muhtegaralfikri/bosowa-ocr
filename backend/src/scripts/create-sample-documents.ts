import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

async function createSampleDocuments() {
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

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Sample documents for each unit bisnis
  const documents = [
    // BOSOWA_TAXI documents
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      letterNumber: 'TAXI/INV/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'INVOICE',
      unitBisnis: 'BOSOWA_TAXI',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'PT Transportasi Makmur',
      alamatPengirim: 'Jl. Transport No. 1, Jakarta',
      teleponPengirim: '021-12345678',
      perihal: 'Invoice Layanan Taxi Bulan Desember',
      totalNominal: 15000000,
      nominalList: [5000000, 10000000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      letterNumber: 'TAXI/MEMO/2024/001',
      jenisSurat: 'KELUAR',
      jenisDokumen: 'INTERNAL_MEMO',
      unitBisnis: 'BOSOWA_TAXI',
      tanggalSurat: '2024-12-02',
      namaPengirim: 'Manager Operasional Taxi',
      alamatPengirim: 'Kantor Pusat Bosowa Taxi',
      teleponPengirim: '021-87654321',
      perihal: 'Memo: Perubahan Jadwal Operasional',
      totalNominal: 0,
      nominalList: [],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      letterNumber: 'TAXI/PAD/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'PAD',
      unitBisnis: 'BOSOWA_TAXI',
      tanggalSurat: '2024-12-03',
      namaPengirim: 'Dishub Provinsi',
      alamatPengirim: 'Jl. Dishub No. 5, Jakarta',
      teleponPengirim: '021-11223344',
      perihal: 'Pemberitahuan Admin Disposisi',
      totalNominal: 2500000,
      nominalList: [2500000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    // PORT_MANAGEMENT documents
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      letterNumber: 'PORT/BBA/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'SURAT',
      unitBisnis: 'PORT_MANAGEMENT',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'PT Shipping Line',
      alamatPengirim: 'Jl. Pelabuhan No. 10, Makassar',
      teleponPengirim: '0411-123456',
      perihal: 'Konfirmasi Jadwal Kapal',
      totalNominal: 50000000,
      nominalList: [50000000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const doc of documents) {
    // Check if document already exists
    const existing = await dataSource.query(
      'SELECT id FROM letters WHERE id = ?',
      [doc.id]
    );

    if (existing.length === 0) {
      await dataSource.query(`
        INSERT INTO letters (
          id, letterNumber, jenisSurat, jenisDokumen, unitBisnis,
          tanggalSurat, namaPengirim, alamatPengirim, teleponPengirim,
          perihal, totalNominal, nominalList, fileId, fileUrl,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        doc.id, doc.letterNumber, doc.jenisSurat, doc.jenisDokumen, doc.unitBisnis,
        doc.tanggalSurat, doc.namaPengirim, doc.alamatPengirim, doc.teleponPengirim,
        doc.perihal, doc.totalNominal, JSON.stringify(doc.nominalList), doc.fileId, doc.fileUrl,
        doc.createdAt, doc.updatedAt
      ]);
      console.log(`Created: ${doc.letterNumber} (${doc.unitBisnis})`);
    } else {
      console.log(`Already exists: ${doc.letterNumber}`);
    }
  }

  await dataSource.destroy();
  console.log('Sample documents created!');
}

createSampleDocuments().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
