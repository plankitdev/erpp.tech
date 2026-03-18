<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'backup:run {--db-only : Only backup database}';
    protected $description = 'Create a backup of the database and uploaded files';

    public function handle(): int
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $backupDir = storage_path('backups');

        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        // Database backup
        $this->info('Backing up database...');
        $dbFile = "{$backupDir}/db_{$timestamp}.sql";

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $command = sprintf(
            'mysqldump --host=%s --port=%s --user=%s --password=%s %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg((string) $port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($dbFile)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $this->error('Database backup failed: ' . implode("\n", $output));
            return self::FAILURE;
        }

        // Compress the SQL file
        $gzFile = "{$dbFile}.gz";
        $fp = gzopen($gzFile, 'w9');
        if ($fp && file_exists($dbFile)) {
            gzwrite($fp, file_get_contents($dbFile));
            gzclose($fp);
            unlink($dbFile);
            $this->info("Database backup: {$gzFile}");
        }

        // Files backup (uploads)
        if (!$this->option('db-only')) {
            $this->info('Backing up uploaded files...');
            $storagePublic = storage_path('app/public');
            if (is_dir($storagePublic)) {
                $filesArchive = "{$backupDir}/files_{$timestamp}.tar.gz";
                $tarCommand = sprintf(
                    'tar -czf %s -C %s .',
                    escapeshellarg($filesArchive),
                    escapeshellarg($storagePublic)
                );
                exec($tarCommand, $tarOutput, $tarReturn);
                if ($tarReturn === 0) {
                    $this->info("Files backup: {$filesArchive}");
                } else {
                    $this->warn('Files backup failed, continuing...');
                }
            }
        }

        // Clean old backups (keep last 7 days)
        $this->cleanOldBackups($backupDir, 7);

        $this->info('Backup completed successfully!');
        return self::SUCCESS;
    }

    private function cleanOldBackups(string $dir, int $keepDays): void
    {
        $cutoff = now()->subDays($keepDays)->timestamp;
        $files = glob("{$dir}/*");

        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoff) {
                unlink($file);
                $this->line("Removed old backup: " . basename($file));
            }
        }
    }
}
