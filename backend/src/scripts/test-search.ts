import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function testSearchFunctionality() {
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

  // Test search queries
  const testQueries = [
    { keyword: 'taxi', description: 'Search for "taxi"' },
    { keyword: 'bosowa', description: 'Search for "bosowa"' },
    { keyword: 'BOSOWA_TAXI', description: 'Search for exact unit bisnis' },
    { keyword: 'port', description: 'Search for "port"' },
    { keyword: 'management', description: 'Search for "management"' },
    { keyword: 'memo', description: 'Search for "memo"' },
    { keyword: 'invoice', description: 'Search for "invoice"' },
    { keyword: 'pad', description: 'Search for "pad"' },
  ];

  for (const test of testQueries) {
    console.log(`\n--- ${test.description} ---`);
    
    const results = await dataSource.query(`
      SELECT 
        letterNumber, 
        jenisDokumen, 
        unitBisnis, 
        namaPengirim, 
        perihal
      FROM letters 
      WHERE 
        letterNumber LIKE ? OR 
        namaPengirim LIKE ? OR 
        perihal LIKE ? OR 
        jenisSurat LIKE ? OR 
        jenisDokumen LIKE ? OR
        unitBisnis LIKE ?
      ORDER BY createdAt DESC
    `, [`%${test.keyword}%`, `%${test.keyword}%`, `%${test.keyword}%`, `%${test.keyword}%`, `%${test.keyword}%`, `%${test.keyword}%`]);

    console.log(`Found ${results.length} results:`);
    results.forEach((row: any) => {
      console.log(`  - ${row.letterNumber} | ${row.unitBisnis} | ${row.jenisDokumen} | ${row.namaPengirim}`);
    });
  }

  await dataSource.destroy();
  console.log('\nTest completed!');
}

testSearchFunctionality().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
