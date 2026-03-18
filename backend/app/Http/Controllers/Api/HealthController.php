<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    public function check()
    {
        $checks = [];
        $healthy = true;

        // Database
        try {
            DB::select('SELECT 1');
            $checks['database'] = ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Exception $e) {
            $checks['database'] = ['status' => 'error', 'message' => 'Connection failed'];
            $healthy = false;
        }

        // Storage
        try {
            $testFile = 'health_check_' . time() . '.tmp';
            Storage::disk('local')->put($testFile, 'ok');
            Storage::disk('local')->delete($testFile);
            $checks['storage'] = ['status' => 'ok', 'message' => 'Writable'];
        } catch (\Exception $e) {
            $checks['storage'] = ['status' => 'error', 'message' => 'Not writable'];
            $healthy = false;
        }

        // Disk space
        $freeSpace = disk_free_space(storage_path());
        $totalSpace = disk_total_space(storage_path());
        $usedPercent = round((1 - $freeSpace / $totalSpace) * 100, 1);
        $checks['disk'] = [
            'status' => $usedPercent > 90 ? 'warning' : 'ok',
            'used_percent' => $usedPercent,
            'free_gb' => round($freeSpace / 1073741824, 2),
        ];
        if ($usedPercent > 95) $healthy = false;

        // Memory
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = $this->parseBytes(ini_get('memory_limit'));
        $checks['memory'] = [
            'status' => 'ok',
            'used_mb' => round($memoryUsage / 1048576, 1),
            'limit_mb' => round($memoryLimit / 1048576, 1),
        ];

        // App info
        $checks['app'] = [
            'environment' => app()->environment(),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'uptime' => $this->getUptime(),
        ];

        return response()->json([
            'healthy' => $healthy,
            'timestamp' => now()->toISOString(),
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    public function systemStatus()
    {
        $stats = [
            'users' => DB::table('users')->count(),
            'companies' => DB::table('companies')->count(),
            'tasks' => [
                'total' => DB::table('tasks')->count(),
                'active' => DB::table('tasks')->whereIn('status', ['todo', 'in_progress', 'review'])->count(),
            ],
            'invoices' => [
                'total' => DB::table('invoices')->count(),
                'overdue' => DB::table('invoices')->where('status', 'overdue')->count(),
            ],
            'storage' => [
                'used_percent' => round((1 - disk_free_space(storage_path()) / disk_total_space(storage_path())) * 100, 1),
                'free_gb' => round(disk_free_space(storage_path()) / 1073741824, 2),
            ],
            'recent_errors' => $this->getRecentLogErrors(),
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    private function getUptime(): string
    {
        if (PHP_OS_FAMILY === 'Linux') {
            $uptime = @file_get_contents('/proc/uptime');
            if ($uptime) {
                $seconds = (int) explode(' ', $uptime)[0];
                $days = floor($seconds / 86400);
                $hours = floor(($seconds % 86400) / 3600);
                return "{$days}d {$hours}h";
            }
        }
        return 'N/A';
    }

    private function getRecentLogErrors(): int
    {
        $logFile = storage_path('logs/laravel.log');
        if (!file_exists($logFile)) return 0;

        $today = now()->format('Y-m-d');
        $count = 0;
        $handle = @fopen($logFile, 'r');
        if ($handle) {
            while (($line = fgets($handle)) !== false) {
                if (str_contains($line, $today) && str_contains($line, '.ERROR:')) {
                    $count++;
                }
            }
            fclose($handle);
        }
        return $count;
    }

    private function parseBytes(string $value): int
    {
        $value = trim($value);
        $unit = strtolower(substr($value, -1));
        $num = (int) $value;

        return match ($unit) {
            'g' => $num * 1073741824,
            'm' => $num * 1048576,
            'k' => $num * 1024,
            default => $num,
        };
    }
}
