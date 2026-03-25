<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = [
    'leads' => App\Models\Lead::count(),
    'contracts' => App\Models\Contract::count(),
    'invoices' => App\Models\Invoice::count(),
    'invoice_payments' => App\Models\InvoicePayment::count(),
    'expenses' => App\Models\Expense::count(),
    'quotations' => App\Models\Quotation::count(),
    'projects' => App\Models\Project::count(),
    'tasks' => App\Models\Task::count(),
    'tickets' => App\Models\Ticket::count(),
    'meetings' => App\Models\Meeting::count(),
    'partners' => App\Models\Partner::count(),
    'partner_payments' => App\Models\PartnerPayment::count(),
    'salary_payments' => App\Models\SalaryPayment::count(),
    'treasury_transactions' => App\Models\TreasuryTransaction::count(),
    'installments' => App\Models\Installment::count(),
    'leave_requests' => App\Models\LeaveRequest::count(),
    'attendance_records' => App\Models\AttendanceRecord::count(),
    'announcements' => App\Models\Announcement::count(),
    'time_entries' => App\Models\TimeEntry::count(),
    'activity_logs' => App\Models\ActivityLog::count(),
    'managed_files' => App\Models\ManagedFile::count(),
    'folders' => App\Models\Folder::count(),
    'workflow_rules' => App\Models\WorkflowRule::count(),
    'chat_messages' => App\Models\ChatMessage::count(),
    'chat_channels' => App\Models\ChatChannel::count(),
    'notifications' => DB::table('notifications')->count(),
    'users' => App\Models\User::count(),
    'employees' => App\Models\Employee::count(),
    'clients' => App\Models\Client::count(),
];

echo "=== DATABASE COUNTS ===" . PHP_EOL;
foreach ($tables as $name => $count) {
    echo str_pad($name, 25) . ": " . $count . PHP_EOL;
}
echo "=== DONE ===" . PHP_EOL;
