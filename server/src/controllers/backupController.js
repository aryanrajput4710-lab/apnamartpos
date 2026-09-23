const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const getBackupDir = () => {
  const defaultDir = path.join(process.cwd(), '..', 'Backups');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
};

const getBackupStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(200).json({ 
        success: true, 
        data: { 
          status: 'Managed by Cloud Provider (Render/Supabase)', 
          lastBackup: 'Automated Daily', 
          location: 'Cloud Storage' 
        } 
      });
    }

    const backupDir = getBackupDir();
    let lastBackup = null;
    let status = 'No backup has been created yet.';

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql') || f.endsWith('.dump'));
    
    if (files.length > 0) {
      const sorted = files
        .map(name => ({ name, time: fs.statSync(path.join(backupDir, name)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
        
      lastBackup = new Date(sorted[0].time).toISOString();
      status = 'Successful';
    }

    res.status(200).json({ success: true, data: { lastBackup, location: backupDir, status } });
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createBackup = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ 
        success: false, 
        message: 'In production, backups are automated by the managed PostgreSQL provider (e.g., Render/Supabase). Please use the provider console for backups.' 
      });
    }

    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `apna-mart-backup-${timestamp}.dump`;
    const filepath = path.join(backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('Database URL not found');

    const command = `pg_dump "${dbUrl}" -F c -f "${filepath}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        return res.status(500).json({ success: false, message: 'Backup failed.' });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'BACKUP_CREATED',
          entityType: 'BACKUP',
          description: `Backup created: ${filename}`,
          metadata: { filepath }
        }
      });

      res.status(200).json({ success: true, message: 'Backup created successfully', data: { filepath } });
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const restoreBackup = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ 
        success: false, 
        message: 'In production, database restoration must be done through the managed PostgreSQL provider console to prevent catastrophic data loss.' 
      });
    }

    const { filename } = req.body;
    if (!filename) return res.status(400).json({ success: false, message: 'Filename is required' });

    const backupDir = getBackupDir();
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    const dbUrl = process.env.DATABASE_URL;
    const command = `pg_restore --clean -d "${dbUrl}" "${filepath}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Restore failed:', error);
        return res.status(500).json({ success: false, message: 'Restore failed.' });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'BACKUP_RESTORED',
          entityType: 'BACKUP',
          description: `Backup restored from: ${filename}`,
          metadata: { filepath }
        }
      });

      res.status(200).json({ success: true, message: 'Database restored successfully' });
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getBackupStatus,
  createBackup,
  restoreBackup
};

