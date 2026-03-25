<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

DB::statement('SET FOREIGN_KEY_CHECKS=0');

// Delete in dependency order
$tables = [
    'activity_logs',
    'notifications',
    'chat_messages',
    'chat_channels',
    'time_entries',
    'task_files',
    'task_user',
    'tasks',
    'project_files',
    'projects',
    'meetings',
    'meeting_user',
    'announcements',
    'announcement_user',
    'leads',
    'tickets',
    'invoice_payments',
    'installments',
    'invoices',
    'contracts',
    'expenses',
    'quotations',
    'partners',
    'partner_payments',
    'salary_payments',
    'treasury_transactions',
    'leave_requests',
    'attendance_records',
    'workflow_rules',
    'workflow_actions',
    'managed_files',
    'folders',
    'tags',
    'taggables',
    'employee_files',
    'file_templates',
];

echo "=== CLEANING DATA ===" . PHP_EOL;
foreach ($tables as $table) {
    try {
        $count = DB::table($table)->count();
        if ($count > 0) {
            DB::table($table)->truncate();
            echo "TRUNCATED $table ($count records)" . PHP_EOL;
        } else {
            echo "SKIPPED  $table (empty)" . PHP_EOL;
        }
    } catch (\Exception $e) {
        echo "SKIP     $table (not found)" . PHP_EOL;
    }
}

// Clean uploaded files (but keep the directory)
$cleaned = 0;
foreach (['file-manager', 'task-files', 'project-files', 'employee-files'] as $dir) {
    if (Storage::disk('public')->exists($dir)) {
        $files = Storage::disk('public')->allFiles($dir);
        foreach ($files as $file) {
            Storage::disk('public')->delete($file);
            $cleaned++;
        }
    }
}
echo PHP_EOL . "Cleaned $cleaned uploaded files" . PHP_EOL;

DB::statement('SET FOREIGN_KEY_CHECKS=1');

// Final counts
echo PHP_EOL . "=== REMAINING DATA ===" . PHP_EOL;
echo "users:     " . App\Models\User::count() . PHP_EOL;
echo "employees: " . App\Models\Employee::count() . PHP_EOL;
echo "clients:   " . App\Models\Client::count() . PHP_EOL;
echo PHP_EOL . "=== DONE ===" . PHP_EOL;
