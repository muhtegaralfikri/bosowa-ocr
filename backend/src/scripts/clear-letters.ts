import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function clearLettersTable() {
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
    // Check if we want to backup first
    const backup = await dataSource.query('SELECT COUNT(*) as count FROM letters');
    console.log(`Current letters count: ${backup[0].count}`);
    
    if (backup[0].count > 0) {
      console.log('\n⚠️  WARNING: This will delete ALL letters and related data!');
      console.log('Related tables that will be affected:');
      console.log('- letters (main data)');
      console.log('- edit_logs (audit trail)');
      console.log('- delete_requests (delete workflows)');
      console.log('- signature_requests (signature workflows)');
      
      // Delete from related tables first (due to foreign key constraints)
      console.log('\n🔄 Step 1: Clearing edit_logs...');
      await dataSource.query('DELETE FROM edit_logs');
      console.log('✅ edit_logs cleared');
      
      console.log('🔄 Step 2: Clearing delete_requests...');
      await dataSource.query('DELETE FROM delete_requests');
      console.log('✅ delete_requests cleared');
      
      console.log('🔄 Step 3: Clearing signature_requests...');
      await dataSource.query('DELETE FROM signature_requests');
      console.log('✅ signature_requests cleared');
      
      console.log('🔄 Step 4: Clearing letters...');
      await dataSource.query('DELETE FROM letters');
      console.log('✅ letters cleared');
      
      // Reset auto-increment
      console.log('🔄 Step 5: Resetting auto-increment...');
      await dataSource.query('ALTER TABLE letters AUTO_INCREMENT = 1');
      console.log('✅ Auto-increment reset');
      
      console.log('\n🎉 Database cleared successfully!');
      
      // Verify deletion
      const remaining = await dataSource.query('SELECT COUNT(*) as count FROM letters');
      console.log(`Remaining letters: ${remaining[0].count}`);
      
    } else {
      console.log('✅ Letters table is already empty!');
    }
    
  } catch (error: any) {
    console.error('❌ Error clearing letters table:', error.message);
    throw error;
  }

  await dataSource.destroy();
  console.log('Database connection closed.');
}

// Run with confirmation
const args = process.argv;
const forceDelete = args.includes('--force') || args.includes('-f');

if (!forceDelete) {
  console.log('⚠️  To run this script, add --force flag:');
  console.log('   npx ts-node src/scripts/clear-letters.ts --force');
  console.log('   or');
  console.log('   npm run clear-letters');
  process.exit(0);
} else {
  console.log('🚀 Clearing letters table...');
  clearLettersTable().catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
}
