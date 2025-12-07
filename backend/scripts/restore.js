/**
 * Database Restore Script
 * Restore database dari file backup
 *
 * Usage:
 *   npm run restore -- <backup_file>
 *   node scripts/restore.js backup_letterdb_20251207_120000.sql
 *
 * aaPanel MySQL path (Linux):
 *   /www/server/mysql/bin/mysql
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// aaPanel default path atau custom path dari env
const MYSQL_CMD =
  process.env.MYSQL_PATH ||
  (process.platform === 'linux' ? '/www/server/mysql/bin/mysql' : 'mysql');

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('[INFO] No backups found');
    return [];
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
    }))
    .sort((a, b) => b.time.getTime() - a.time.getTime());

  console.log('\n=== Available Backups ===\n');
  files.forEach((f, i) => {
    const sizeMB = (f.size / 1024 / 1024).toFixed(2);
    console.log(`${i + 1}. ${f.name} (${sizeMB} MB) - ${f.time.toLocaleString()}`);
  });
  console.log('');

  return files;
}

function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function runRestore(backupFile) {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '3306';
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;
  const dbName = process.env.DB_NAME;

  if (!dbUser || !dbPassword || !dbName) {
    console.error('[ERROR] Database credentials not found in .env file');
    process.exit(1);
  }

  let filepath;

  if (!backupFile) {
    const backups = listBackups();
    if (backups.length === 0) {
      process.exit(1);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('Enter backup number to restore: ', (ans) => {
        rl.close();
        resolve(ans);
      });
    });

    const index = parseInt(answer) - 1;
    if (isNaN(index) || index < 0 || index >= backups.length) {
      console.error('[ERROR] Invalid selection');
      process.exit(1);
    }

    filepath = backups[index].path;
  } else {
    filepath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(BACKUP_DIR, backupFile);
  }

  if (!fs.existsSync(filepath)) {
    console.error(`[ERROR] Backup file not found: ${filepath}`);
    process.exit(1);
  }

  console.log(`\n[WARNING] This will OVERWRITE all data in database: ${dbName}`);
  console.log(`[INFO] Restore from: ${path.basename(filepath)}\n`);

  const confirmed = await confirm('Are you sure you want to continue? (y/N): ');

  if (!confirmed) {
    console.log('[INFO] Restore cancelled');
    process.exit(0);
  }

  const command = `${MYSQL_CMD} -h ${dbHost} -P ${dbPort} -u ${dbUser} -p"${dbPassword}" ${dbName} < "${filepath}"`;

  console.log(`\n[INFO] Restoring database...`);
  console.log(`[INFO] Using: ${MYSQL_CMD}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`[ERROR] Restore failed: ${error.message}`);
      process.exit(1);
    }

    if (stderr && !stderr.includes('Warning')) {
      console.warn(`[WARN] ${stderr}`);
    }

    console.log(`[SUCCESS] Database restored successfully!`);
  });
}

const backupFile = process.argv[2];
runRestore(backupFile);
