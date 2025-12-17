import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function createTestData() {
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

  // Realistic test data for each unit bisnis
  const documents = [
    // BOSOWA_TAXI Documents
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      letterNumber: 'TAXI/INV/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'INVOICE',
      unitBisnis: 'BOSOWA_TAXI',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'PT Transportasi Makmur Sejahtera',
      alamatPengirim: 'Jl. Sudirman No. 123, Jakarta Pusat',
      teleponPengirim: '021-12345678',
      perihal: 'Invoice Layanan Taxi Bulan Desember 2024',
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
      namaPengirim: 'Manager Operasional Bosowa Taxi',
      alamatPengirim: 'Kantor Pusat Bosowa Taxi, Makassar',
      teleponPengirim: '0411-87654321',
      perihal: 'Memo Internal: Perubahan Jadwal Operasional Tahun Baru',
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
      namaPengirim: 'Dinas Perhubungan Provinsi Sulsel',
      alamatPengirim: 'Jl. Perhubungan No. 5, Makassar',
      teleponPengirim: '0411-11223344',
      perihal: 'Pemberitahuan Admin Disposisi: Kenaikan Tarif Taxi',
      totalNominal: 2500000,
      nominalList: [2500000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    // PORT_MANAGEMENT Documents  
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      letterNumber: 'PORT/BBA/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'SURAT',
      unitBisnis: 'PORT_MANAGEMENT',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'PT Pelayaran Nusantara Jaya',
      alamatPengirim: 'Jl. Pelabuhan No. 10, Makassar',
      teleponPengirim: '0411-123456',
      perihal: 'Konfirmasi Jadwal Sandar Kapal KM Nusantara 5',
      totalNominal: 50000000,
      nominalList: [50000000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      letterNumber: 'PORT/PAD/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'PAD',
      unitBisnis: 'PORT_MANAGEMENT',
      tanggalSurat: '2024-12-02',
      namaPengirim: 'Kesyahbandaran Tanjung Priok',
      alamatPengirim: 'Jl. Priok No. 1, Jakarta',
      teleponPengirim: '021-55566677',
      perihal: 'Instruksi Direktur Operasional: Protokol Baru',
      totalNominal: 0,
      nominalList: [],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    // OTORENTAL Documents
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      letterNumber: 'OTO/INV/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'INVOICE',
      unitBisnis: 'OTORENTAL_NUSANTARA',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'CV Rental Mobil Mantap',
      alamatPengirim: 'Jl. Merdeka No. 45, Jakarta',
      teleponPengirim: '021-99887766',
      perihal: 'Invoice Sewa Mobil Bulan November 2024',
      totalNominal: 25000000,
      nominalList: [15000000, 10000000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    // MALLOMO Documents
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      letterNumber: 'MAL/SURAT/2024/001',
      jenisSurat: 'KELUAR',
      jenisDokumen: 'SURAT',
      unitBisnis: 'MALLOMO',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'Manager Mallomo',
      alamatPengirim: 'Jl. Mallomo No. 8, Makassar',
      teleponPengirim: '0411-55544433',
      perihal: 'Penawaran Kerjasama Jasa Pengiriman',
      totalNominal: 0,
      nominalList: [],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    // LAGALIGO Documents
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      letterNumber: 'LOG/MEMO/2024/001',
      jenisSurat: 'KELUAR',
      jenisDokumen: 'INTERNAL_MEMO',
      unitBisnis: 'LAGALIGO_LOGISTIK',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'Manager Logistik',
      alamatPengirim: 'Gudang Lagaligo, Makassar',
      teleponPengirim: '0411-22211144',
      perihal: 'Memo: Sistem Tracking Barang Baru',
      totalNominal: 0,
      nominalList: [],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    },
    // OTO_GARAGE Documents
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      letterNumber: 'GAR/INV/2024/001',
      jenisSurat: 'MASUK',
      jenisDokumen: 'INVOICE',
      unitBisnis: 'OTO_GARAGE_INDONESIA',
      tanggalSurat: '2024-12-01',
      namaPengirim: 'PT Sparepart Indonesia',
      alamatPengirim: 'Jl. Otomotif No. 99, Jakarta',
      teleponPengirim: '021-66655577',
      perihal: 'Invoice Pembelian Suku Cadang Mobil',
      totalNominal: 35000000,
      nominalList: [20000000, 15000000],
      fileId: null,
      fileUrl: null,
      createdAt: now,
      updatedAt: now
    }
  ];

  console.log(`Creating ${documents.length} test documents...`);

  for (const doc of documents) {
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
    console.log(`✅ Created: ${doc.letterNumber} (${doc.unitBisnis}) - ${doc.jenisDokumen}`);
  }

  // Verify creation
  const total = await dataSource.query('SELECT COUNT(*) as count FROM letters');
  console.log(`\n🎉 Total documents created: ${total[0].count}`);

  await dataSource.destroy();
  console.log('Test data creation completed!');
}

createTestData().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
