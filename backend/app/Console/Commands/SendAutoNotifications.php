<?php

namespace App\Console\Commands;

use App\Mail\PlatformEmail;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendAutoNotifications extends Command
{
    protected $signature = 'notifications:send-auto';
    protected $description = 'إرسال إشعارات تلقائية للفواتير المتأخرة والمهام القريبة من الموعد';

    public function handle(): int
    {
        $count = 0;
        $count += $this->notifyOverdueInvoices();
        $count += $this->notifyUpcomingTaskDeadlines();
        $count += $this->notifyExpiringContracts();

        $this->info("تم إرسال {$count} إشعار تلقائي");
        return self::SUCCESS;
    }

    private function notifyOverdueInvoices(): int
    {
        $count = 0;
        $overdueInvoices = Invoice::with('contract.client')
            ->where('status', Invoice::STATUS_OVERDUE)
            ->where('due_date', '>=', now()->subDays(30))
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $companyId = $invoice->company_id;
            $clientName = $invoice->contract?->client?->name ?? 'غير محدد';
            $daysOverdue = now()->diffInDays($invoice->due_date);

            $users = User::where('company_id', $companyId)
                ->whereIn('role', ['super_admin', 'manager', 'accountant'])
                ->get();

            foreach ($users as $user) {
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', Notification::TYPE_INVOICE_OVERDUE)
                    ->where('link', "/invoices/{$invoice->id}")
                    ->where('created_at', '>=', now()->subDays(3))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'company_id' => $companyId,
                        'user_id' => $user->id,
                        'type' => Notification::TYPE_INVOICE_OVERDUE,
                        'title' => 'فاتورة متأخرة',
                        'body' => "فاتورة العميل {$clientName} بمبلغ {$invoice->amount} متأخرة منذ {$daysOverdue} يوم",
                        'link' => "/invoices/{$invoice->id}",
                    ]);

                    // Send email if user has an email address
                    if ($user->email && config('mail.default') !== 'log') {
                        $emailBody = "مرحباً {$user->name},\n\n"
                            . "نود إعلامك بأن الفاتورة رقم #{$invoice->id} للعميل \"{$clientName}\" "
                            . "بمبلغ {$invoice->amount} {$invoice->currency} متأخرة منذ {$daysOverdue} يوم.\n\n"
                            . "تاريخ الاستحقاق: {$invoice->due_date}\n\n"
                            . "يرجى اتخاذ الإجراء المناسب في أقرب وقت ممكن.";

                        try {
                            Mail::to($user->email)->send(
                                new PlatformEmail('فاتورة متأخرة — ERPFlex', $emailBody, 'ERPFlex')
                            );
                        } catch (\Throwable $e) {
                            // Don't let email failure block in-app notifications
                            logger()->warning('Failed to send overdue invoice email', ['error' => $e->getMessage()]);
                        }
                    }

                    $count++;
                }
            }
        }

        return $count;
    }

    private function notifyUpcomingTaskDeadlines(): int
    {
        $count = 0;
        $upcomingTasks = Task::with('assignedUser')
            ->whereIn('status', [Task::STATUS_TODO, Task::STATUS_IN_PROGRESS])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [now(), now()->addDays(2)])
            ->get();

        foreach ($upcomingTasks as $task) {
            if (!$task->assigned_to) continue;

            $exists = Notification::where('user_id', $task->assigned_to)
                ->where('type', Notification::TYPE_TASK_ASSIGNED)
                ->where('link', "/tasks")
                ->where('body', 'LIKE', "%{$task->title}%")
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if (!$exists) {
                $daysLeft = now()->diffInDays($task->due_date);
                $label = $daysLeft === 0 ? 'اليوم' : "خلال {$daysLeft} يوم";

                Notification::create([
                    'company_id' => $task->company_id,
                    'user_id' => $task->assigned_to,
                    'type' => Notification::TYPE_TASK_ASSIGNED,
                    'title' => 'موعد تسليم مهمة قريب',
                    'body' => "المهمة \"{$task->title}\" موعد تسليمها {$label}",
                    'link' => '/tasks',
                ]);

                // Email the task owner about the approaching deadline
                $user = $task->assignedUser;
                if ($user && $user->email && config('mail.default') !== 'log') {
                    $emailBody = "مرحباً {$user->name},\n\n"
                        . "تذكير: المهمة \"{$task->title}\" موعد تسليمها {$label}.\n\n"
                        . "يرجى التأكد من الانتهاء منها في الوقت المحدد.";

                    try {
                        Mail::to($user->email)->send(
                            new PlatformEmail('تذكير: موعد تسليم مهمة — ERPFlex', $emailBody, 'ERPFlex')
                        );
                    } catch (\Throwable $e) {
                        logger()->warning('Failed to send task deadline email', ['error' => $e->getMessage()]);
                    }
                }

                $count++;
            }
        }

        return $count;
    }

    private function notifyExpiringContracts(): int
    {
        $count = 0;

        $expiringContracts = \App\Models\Contract::with('client')
            ->where('status', 'active')
            ->whereBetween('end_date', [now(), now()->addDays(14)])
            ->get();

        foreach ($expiringContracts as $contract) {
            $companyId = $contract->company_id;
            $clientName = $contract->client?->name ?? 'غير محدد';
            $daysLeft = now()->diffInDays($contract->end_date);

            $users = User::where('company_id', $companyId)
                ->whereIn('role', ['super_admin', 'manager'])
                ->get();

            foreach ($users as $user) {
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', Notification::TYPE_CONTRACT_EXPIRING)
                    ->where('link', "/contracts/{$contract->id}")
                    ->where('created_at', '>=', now()->subDays(7))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'company_id' => $companyId,
                        'user_id' => $user->id,
                        'type' => Notification::TYPE_CONTRACT_EXPIRING,
                        'title' => 'عقد قارب على الانتهاء',
                        'body' => "عقد العميل {$clientName} سينتهي خلال {$daysLeft} يوم",
                        'link' => "/contracts/{$contract->id}",
                    ]);

                    if ($user->email && config('mail.default') !== 'log') {
                        $emailBody = "مرحباً {$user->name},\n\n"
                            . "تنبيه: عقد العميل \"{$clientName}\" سينتهي خلال {$daysLeft} يوم "
                            . "(تاريخ الانتهاء: {$contract->end_date}).\n\n"
                            . "يرجى التواصل مع العميل للتجديد أو اتخاذ أي إجراء لازم.";

                        try {
                            Mail::to($user->email)->send(
                                new PlatformEmail('عقد قارب على الانتهاء — ERPFlex', $emailBody, 'ERPFlex')
                            );
                        } catch (\Throwable $e) {
                            logger()->warning('Failed to send contract expiring email', ['error' => $e->getMessage()]);
                        }
                    }

                    $count++;
                }
            }
        }

        return $count;
    }
}


    public function handle(): int
    {
        $count = 0;
        $count += $this->notifyOverdueInvoices();
        $count += $this->notifyUpcomingTaskDeadlines();

        $this->info("تم إرسال {$count} إشعار تلقائي");
        return self::SUCCESS;
    }

    private function notifyOverdueInvoices(): int
    {
        $count = 0;
        $overdueInvoices = Invoice::with('contract.client')
            ->where('status', Invoice::STATUS_OVERDUE)
            ->where('due_date', '>=', now()->subDays(30))
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $companyId = $invoice->company_id;
            $clientName = $invoice->contract?->client?->name ?? 'غير محدد';
            $daysOverdue = now()->diffInDays($invoice->due_date);

            // Notify managers and accountants in the same company
            $users = User::where('company_id', $companyId)
                ->whereIn('role', ['super_admin', 'manager', 'accountant'])
                ->get();

            foreach ($users as $user) {
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', Notification::TYPE_INVOICE_OVERDUE)
                    ->where('link', "/invoices/{$invoice->id}")
                    ->where('created_at', '>=', now()->subDays(3))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'company_id' => $companyId,
                        'user_id' => $user->id,
                        'type' => Notification::TYPE_INVOICE_OVERDUE,
                        'title' => 'فاتورة متأخرة',
                        'body' => "فاتورة العميل {$clientName} بمبلغ {$invoice->amount} متأخرة منذ {$daysOverdue} يوم",
                        'link' => "/invoices/{$invoice->id}",
                    ]);
                    $count++;
                }
            }
        }

        return $count;
    }

    private function notifyUpcomingTaskDeadlines(): int
    {
        $count = 0;
        $upcomingTasks = Task::with('assignedUser')
            ->whereIn('status', [Task::STATUS_TODO, Task::STATUS_IN_PROGRESS])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [now(), now()->addDays(2)])
            ->get();

        foreach ($upcomingTasks as $task) {
            if (!$task->assigned_to) continue;

            $exists = Notification::where('user_id', $task->assigned_to)
                ->where('type', Notification::TYPE_TASK_ASSIGNED)
                ->where('link', "/tasks")
                ->where('body', 'LIKE', "%{$task->title}%")
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if (!$exists) {
                $daysLeft = now()->diffInDays($task->due_date);
                $label = $daysLeft === 0 ? 'اليوم' : "خلال {$daysLeft} يوم";

                Notification::create([
                    'company_id' => $task->company_id,
                    'user_id' => $task->assigned_to,
                    'type' => Notification::TYPE_TASK_ASSIGNED,
                    'title' => 'موعد تسليم مهمة قريب',
                    'body' => "المهمة \"{$task->title}\" موعد تسليمها {$label}",
                    'link' => '/tasks',
                ]);
                $count++;
            }
        }

        return $count;
    }
}
