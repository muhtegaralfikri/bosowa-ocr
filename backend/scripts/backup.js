/**
 * Database Backup Script
 * Membuat backup database MySQL ke folder backups/
 *
 * Usage:
 *   npm run backup
 *   node scripts/backup.js
 *
 * aaPanel MySQL path (Linux):
 *   /www/server/mysql/bin/mysqldump
 *
 * Environment variables (optional):
 *   MYSQLDUMP_PATH=/www/server/mysql/bin/mysqldump
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 10;

// aaPanel default path atau custom path dari env
const MYSQLDUMP_CMD =
  process.env.MYSQLDUMP_PATH ||
  (process.platform === 'linux' ? '/www/server/mysql/bin/mysqldump' : 'mysqldump');

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}${second}`;
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[INFO] Created backup directory: ${BACKUP_DIR}`);
  }
}

function cleanOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    toDelete.forEach((file) => {
      fs.unlinkSync(file.path);
      console.log(`[INFO] Deleted old backup: ${file.name}`);
    });
  }
}

function runBackup() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '3306';
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;
  const dbName = process.env.DB_NAME;

  if (!dbUser || !dbPassword || !dbName) {
    console.error('[ERROR] Database credentials not found in .env file');
    console.error('Required: DB_USER, DB_PASSWORD (or DB_PASS), DB_NAME');
    process.exit(1);
  }

  ensureBackupDir();

  const timestamp = formatDate(new Date());
  const filename = `backup_${dbName}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const command = `${MYSQLDUMP_CMD} -h ${dbHost} -P ${dbPort} -u ${dbUser} -p"${dbPassword}" ${dbName} > "${filepath}"`;

  console.log(`[INFO] Starting backup: ${dbName}`);
  console.log(`[INFO] Host: ${dbHost}:${dbPort}`);
  console.log(`[INFO] Target: ${filepath}`);
  console.log(`[INFO] Using: ${MYSQLDUMP_CMD}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`[ERROR] Backup failed: ${error.message}`);

      if (
        error.message.includes('mysqldump') ||
        error.message.includes('not found') ||
        error.message.includes('not recognized')
      ) {
        console.error('[HINT] mysqldump not found. Set MYSQLDUMP_PATH in .env:');
        console.error('       aaPanel Linux: MYSQLDUMP_PATH=/www/server/mysql/bin/mysqldump');
        console.error('       Windows XAMPP: MYSQLDUMP_PATH=C:\\xampp\\mysql\\bin\\mysqldump');
      }

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      process.exit(1);
    }

    if (stderr && !stderr.includes('Warning')) {
      console.warn(`[WARN] ${stderr}`);
    }

    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`[SUCCESS] Backup completed!`);
    console.log(`[INFO] File: ${filename}`);
    console.log(`[INFO] Size: ${sizeMB} MB`);

    cleanOldBackups();

    console.log(`[INFO] Backup directory: ${BACKUP_DIR}`);
  });
}

runBackup();
