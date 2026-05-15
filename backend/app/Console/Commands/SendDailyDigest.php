<?php

namespace App\Console\Commands;

use App\Mail\DailyDigestMail;
use App\Models\Company;
use App\Models\Meeting;
use App\Models\Task;
use App\Models\TreasuryTransaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDailyDigest extends Command
{
    protected $signature = 'reports:daily-digest';
    protected $description = 'Send auto daily digest to managers and admins';

    public function handle(): int
    {
        $this->info('📧 Sending daily digests...');

        $companies = Company::all();

        foreach ($companies as $company) {
            $this->line("Processing company: {$company->name}");

            // Gather stats
            $tasksCompletedToday = Task::withoutGlobalScopes()
                ->where('company_id', $company->id)
                ->where('status', Task::STATUS_DONE)
                ->whereDate('updated_at', today())
                ->count();

            $overdueTasksQuery = Task::withoutGlobalScopes()
                ->where('company_id', $company->id)
                ->whereNotIn('status', [Task::STATUS_DONE])
                ->whereNotNull('due_date')
                ->where('due_date', '<', today());
            
            $overdueTasksCount = (clone $overdueTasksQuery)->count();
            $overdueTasks = (clone $overdueTasksQuery)->with('assignedUser')->limit(5)->get();

            $revenueToday = TreasuryTransaction::withoutGlobalScopes()
                ->where('company_id', $company->id)
                ->where('type', TreasuryTransaction::TYPE_IN)
                ->where('currency', 'EGP')
                ->whereDate('date', today())
                ->sum('amount');

            $meetingsTodayQuery = Meeting::withoutGlobalScopes()
                ->where('company_id', $company->id)
                ->whereDate('start_time', today());
            
            $meetingsTodayCount = (clone $meetingsTodayQuery)->count();
            $meetingsToday = (clone $meetingsTodayQuery)->orderBy('start_time')->get();

            $stats = [
                'tasks_completed_today' => $tasksCompletedToday,
                'overdue_tasks_count'   => $overdueTasksCount,
                'overdue_tasks'         => $overdueTasks,
                'revenue_today'         => $revenueToday,
                'meetings_today_count'  => $meetingsTodayCount,
                'meetings_today'        => $meetingsToday,
            ];

            // Only send if there's actually something to report or if it's a weekday
            if ($tasksCompletedToday === 0 && $overdueTasksCount === 0 && $revenueToday == 0 && $meetingsTodayCount === 0) {
                continue;
            }

            // Find users who should receive the report (super_admin, company_admin, manager)
            $recipients = User::where('company_id', $company->id)
                ->whereIn('role', ['super_admin', 'company_admin', 'manager'])
                ->whereNotNull('email')
                ->get();

            foreach ($recipients as $user) {
                try {
                    Mail::to($user->email)->send(new DailyDigestMail($user, $stats));
                    $this->info("  - Sent to: {$user->email}");
                } catch (\Exception $e) {
                    $this->error("  - Failed to send to: {$user->email} ({$e->getMessage()})");
                }
            }
        }

        $this->info('✅ Daily digests sent.');
        return Command::SUCCESS;
    }
}
