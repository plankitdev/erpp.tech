<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SystemHealthCheck extends Command
{
    protected $signature = 'system:health-check';
    protected $description = 'Check system health and log warnings';

    public function handle(): int
    {
        $issues = [];

        // Check disk space
        $freeSpace = disk_free_space(storage_path());
        $totalSpace = disk_total_space(storage_path());
        $usedPercent = round((1 - $freeSpace / $totalSpace) * 100, 1);

        if ($usedPercent > 90) {
            $issues[] = "Disk usage critical: {$usedPercent}% used, " . round($freeSpace / 1073741824, 2) . "GB free";
        }

        // Check database connection
        try {
            DB::select('SELECT 1');
        } catch (\Exception $e) {
            $issues[] = "Database connection failed: " . $e->getMessage();
        }

        // Check for overdue invoices
        $overdueCount = DB::table('invoices')
            ->where('status', 'overdue')
            ->where('due_date', '<', now()->subDays(30))
            ->count();
        if ($overdueCount > 0) {
            $issues[] = "{$overdueCount} invoices overdue by more than 30 days";
        }

        // Check log file size
        $logFile = storage_path('logs/laravel.log');
        if (file_exists($logFile)) {
            $logSizeMB = filesize($logFile) / 1048576;
            if ($logSizeMB > 100) {
                $issues[] = "Log file is {$logSizeMB}MB - consider rotating";
            }
        }

        // Check backup freshness
        $backupDir = storage_path('backups');
        if (is_dir($backupDir)) {
            $backups = glob("{$backupDir}/db_*.sql.gz");
            if (empty($backups)) {
                $issues[] = "No database backups found";
            } else {
                $latest = max(array_map('filemtime', $backups));
                if ($latest < now()->subDays(2)->timestamp) {
                    $issues[] = "Latest backup is older than 2 days";
                }
            }
        } else {
            $issues[] = "Backup directory does not exist";
        }

        // Report results
        if (empty($issues)) {
            $this->info('All system checks passed.');
            Log::info('System health check: All checks passed');
        } else {
            foreach ($issues as $issue) {
                $this->warn("⚠ {$issue}");
                Log::warning("System health check: {$issue}");
            }

            // Create admin notification for critical issues
            try {
                $admins = DB::table('users')->where('role', 'super_admin')->pluck('id');
                $companyIds = DB::table('users')->where('role', 'super_admin')->pluck('company_id')->unique();

                foreach ($admins as $userId) {
                    foreach ($companyIds as $companyId) {
                        DB::table('notifications')->insert([
                            'company_id' => $companyId,
                            'user_id' => $userId,
                            'title' => 'تنبيه النظام',
                            'body' => 'تم اكتشاف ' . count($issues) . ' مشكلة في فحص النظام',
                            'type' => 'system',
                            'is_read' => false,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        break; // One notification per admin
                    }
                }
            } catch (\Exception $e) {
                // Don't fail the health check if notification fails
                Log::error("Failed to create health check notification: " . $e->getMessage());
            }
        }

        return empty($issues) ? self::SUCCESS : self::FAILURE;
    }
}
