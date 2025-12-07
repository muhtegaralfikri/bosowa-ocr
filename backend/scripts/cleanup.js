/**
 * File Cleanup Script
 * Menghapus file orphan yang tidak ada di database
 *
 * Usage:
 *   npm run cleanup
 *   node scripts/cleanup.js
 *   node scripts/cleanup.js --dry-run  (preview tanpa hapus)
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DRY_RUN = process.argv.includes('--dry-run');

async function getAllFilesRecursive(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await getAllFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function getDbConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  return connection;
}

async function getReferencedFiles(connection) {
  // Get all fileUrls from letters table
  const [letterRows] = await connection.execute(
    'SELECT fileUrl FROM letters WHERE fileUrl IS NOT NULL'
  );

  // Get all filePaths from files table
  const [fileRows] = await connection.execute(
    'SELECT filePath, urlFull FROM files'
  );

  const referencedPaths = new Set();

  // Add paths from letters
  for (const row of letterRows) {
    if (row.fileUrl) {
      // fileUrl format: /uploads/2025/12/filename.jpg
      const relativePath = row.fileUrl.replace(/^\/uploads\//, '');
      referencedPaths.add(relativePath);
    }
  }

  // Add paths from files table
  for (const row of fileRows) {
    if (row.filePath) {
      referencedPaths.add(row.filePath);
    }
  }

  return referencedPaths;
}

async function cleanupOrphanedDbRecords(connection, existingFiles) {
  // Get all records from files table
  const [fileRows] = await connection.execute('SELECT id, filePath FROM files');

  const orphanedIds = [];

  for (const row of fileRows) {
    const fullPath = path.join(UPLOADS_DIR, row.filePath);
    if (!existingFiles.has(fullPath)) {
      orphanedIds.push(row.id);
    }
  }

  if (orphanedIds.length > 0) {
    console.log(`\n[INFO] Found ${orphanedIds.length} orphaned DB records`);

    if (!DRY_RUN) {
      for (const id of orphanedIds) {
        await connection.execute('DELETE FROM files WHERE id = ?', [id]);
      }
      console.log(`[SUCCESS] Deleted ${orphanedIds.length} orphaned DB records`);
    } else {
      console.log('[DRY-RUN] Would delete these DB records');
    }
  }

  return orphanedIds.length;
}

async function runCleanup() {
  console.log('=== File Cleanup Script ===\n');

  if (DRY_RUN) {
    console.log('[MODE] Dry run - no files will be deleted\n');
  }

  let connection;

  try {
    // Get all physical files
    const allFiles = await getAllFilesRecursive(UPLOADS_DIR);
    console.log(`[INFO] Found ${allFiles.length} files in uploads/`);

    // Connect to database
    connection = await getDbConnection();
    console.log('[INFO] Connected to database');

    // Get referenced files
    const referencedFiles = await getReferencedFiles(connection);
    console.log(`[INFO] Found ${referencedFiles.size} files referenced in DB`);

    // Find orphaned files
    const orphanedFiles = [];
    let totalSize = 0;

    for (const filePath of allFiles) {
      const relativePath = path.relative(UPLOADS_DIR, filePath).replace(/\\/g, '/');

      if (!referencedFiles.has(relativePath)) {
        const stats = fs.statSync(filePath);
        orphanedFiles.push({
          path: filePath,
          relativePath,
          size: stats.size,
        });
        totalSize += stats.size;
      }
    }

    console.log(`\n[RESULT] Found ${orphanedFiles.length} orphaned files`);

    if (orphanedFiles.length > 0) {
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`[INFO] Total size: ${sizeMB} MB\n`);

      console.log('Orphaned files:');
      orphanedFiles.slice(0, 20).forEach((f) => {
        const sizeKB = (f.size / 1024).toFixed(1);
        console.log(`  - ${f.relativePath} (${sizeKB} KB)`);
      });

      if (orphanedFiles.length > 20) {
        console.log(`  ... and ${orphanedFiles.length - 20} more files`);
      }

      if (!DRY_RUN) {
        console.log('\n[INFO] Deleting orphaned files...');

        let deleted = 0;
        for (const file of orphanedFiles) {
          try {
            fs.unlinkSync(file.path);
            deleted++;
          } catch (err) {
            console.error(`[ERROR] Failed to delete: ${file.relativePath}`);
          }
        }

        console.log(`[SUCCESS] Deleted ${deleted} files (${sizeMB} MB freed)`);

        // Clean up empty directories
        await cleanupEmptyDirs(UPLOADS_DIR);
      } else {
        console.log('\n[DRY-RUN] Would delete these files');
      }
    }

    // Clean orphaned DB records
    const existingFilesSet = new Set(allFiles);
    await cleanupOrphanedDbRecords(connection, existingFilesSet);

    console.log('\n[DONE] Cleanup completed!');
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function cleanupEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      await cleanupEmptyDirs(fullPath);
    }
  }

  // Check if directory is now empty
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0 && dir !== UPLOADS_DIR) {
    fs.rmdirSync(dir);
    console.log(`[INFO] Removed empty directory: ${path.relative(UPLOADS_DIR, dir)}`);
  }
}

runCleanup();
