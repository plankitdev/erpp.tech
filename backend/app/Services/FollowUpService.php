<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Contract;
use App\Models\FollowUp;
use App\Models\Invoice;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class FollowUpService
{
    /**
     * Run all auto-generation checks for a specific company.
     * Called by the scheduled command daily.
     */
    public static function generateForCompany(int $companyId): array
    {
        $stats = [
            'task_overdue'       => 0,
            'task_stuck'         => 0,
            'contract_expiring'  => 0,
            'invoice_unpaid'     => 0,
            'client_inactive'    => 0,
        ];

        $stats['task_overdue']      = self::checkOverdueTasks($companyId);
        $stats['task_stuck']        = self::checkStuckTasks($companyId);
        $stats['contract_expiring'] = self::checkExpiringContracts($companyId);
        $stats['invoice_unpaid']    = self::checkUnpaidInvoices($companyId);
        $stats['client_inactive']   = self::checkInactiveClients($companyId);

        return $stats;
    }

    /**
     * Tasks that are overdue (past due_date, not done).
     * - Overdue 1 day → medium priority → assigned to task assignee
     * - Overdue 3+ days → high priority → escalate to task creator/manager
     */
    public static function checkOverdueTasks(int $companyId): int
    {
        $created = 0;

        $overdueTasks = Task::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->whereNotIn('status', [Task::STATUS_DONE])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->get();

        foreach ($overdueTasks as $task) {
            // Skip if there's already an active follow-up for this task
            $existingActive = FollowUp::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('followable_type', Task::class)
                ->where('followable_id', $task->id)
                ->where('type', FollowUp::TYPE_TASK_OVERDUE)
                ->active()
                ->exists();

            if ($existingActive) continue;

            $daysOverdue = now()->diffInDays($task->due_date);
            $priority = $daysOverdue >= 3 ? FollowUp::PRIORITY_HIGH : FollowUp::PRIORITY_MEDIUM;

            // If overdue 3+ days, escalate to creator/manager
            $assignTo = $task->assigned_to;
            if ($daysOverdue >= 3 && $task->created_by) {
                $assignTo = $task->created_by;
                $priority = FollowUp::PRIORITY_HIGH;
            }
            if ($daysOverdue >= 7) {
                $priority = FollowUp::PRIORITY_CRITICAL;
            }

            FollowUp::create([
                'company_id'      => $companyId,
                'type'            => FollowUp::TYPE_TASK_OVERDUE,
                'followable_type' => Task::class,
                'followable_id'   => $task->id,
                'assigned_to'     => $assignTo,
                'status'          => FollowUp::STATUS_PENDING,
                'priority'        => $priority,
                'note'            => "المهمة \"{$task->title}\" متأخرة {$daysOverdue} يوم",
                'due_date'        => now()->addDay(),
                'auto_generated'  => true,
            ]);

            // Send notification
            if ($assignTo) {
                NotificationService::notify(
                    $companyId,
                    $assignTo,
                    'follow_up',
                    '📋 متابعة: مهمة متأخرة',
                    "المهمة \"{$task->title}\" متأخرة {$daysOverdue} يوم — تحتاج إجراء",
                    "/tasks/{$task->id}"
                );
            }

            $created++;
        }

        return $created;
    }

    /**
     * Tasks stuck in 'in_progress' for 3+ days without update.
     */
    public static function checkStuckTasks(int $companyId): int
    {
        $created = 0;

        $stuckTasks = Task::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('status', Task::STATUS_IN_PROGRESS)
            ->where('updated_at', '<', now()->subDays(3))
            ->get();

        foreach ($stuckTasks as $task) {
            $existingActive = FollowUp::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('followable_type', Task::class)
                ->where('followable_id', $task->id)
                ->where('type', FollowUp::TYPE_TASK_STUCK)
                ->active()
                ->exists();

            if ($existingActive) continue;

            $daysSinceUpdate = now()->diffInDays($task->updated_at);

            FollowUp::create([
                'company_id'      => $companyId,
                'type'            => FollowUp::TYPE_TASK_STUCK,
                'followable_type' => Task::class,
                'followable_id'   => $task->id,
                'assigned_to'     => $task->assigned_to,
                'status'          => FollowUp::STATUS_PENDING,
                'priority'        => $daysSinceUpdate >= 7 ? FollowUp::PRIORITY_HIGH : FollowUp::PRIORITY_MEDIUM,
                'note'            => "المهمة \"{$task->title}\" متوقفة منذ {$daysSinceUpdate} يوم بدون تحديث",
                'due_date'        => now()->addDay(),
                'auto_generated'  => true,
            ]);

            $created++;
        }

        return $created;
    }

    /**
     * Contracts expiring within 30 days.
     */
    public static function checkExpiringContracts(int $companyId): int
    {
        $created = 0;

        $contracts = Contract::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('status', Contract::STATUS_ACTIVE)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [now(), now()->addDays(30)])
            ->get();

        foreach ($contracts as $contract) {
            $existingActive = FollowUp::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('followable_type', Contract::class)
                ->where('followable_id', $contract->id)
                ->where('type', FollowUp::TYPE_CONTRACT_EXPIRING)
                ->active()
                ->exists();

            if ($existingActive) continue;

            $daysLeft = now()->diffInDays($contract->end_date);
            $priority = $daysLeft <= 7 ? FollowUp::PRIORITY_HIGH : FollowUp::PRIORITY_MEDIUM;

            // Assign to sales users
            $salesUser = User::where('company_id', $companyId)
                ->whereIn('role', ['sales', 'manager'])
                ->first();

            FollowUp::create([
                'company_id'      => $companyId,
                'type'            => FollowUp::TYPE_CONTRACT_EXPIRING,
                'followable_type' => Contract::class,
                'followable_id'   => $contract->id,
                'assigned_to'     => $salesUser?->id,
                'status'          => FollowUp::STATUS_PENDING,
                'priority'        => $priority,
                'note'            => "عقد العميل \"{$contract->client?->name}\" ينتهي خلال {$daysLeft} يوم",
                'due_date'        => $contract->end_date->subDays(7),
                'auto_generated'  => true,
            ]);

            $created++;
        }

        return $created;
    }

    /**
     * Invoices unpaid for 15+ days past due date.
     */
    public static function checkUnpaidInvoices(int $companyId): int
    {
        $created = 0;

        $invoices = Invoice::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->whereIn('status', [Invoice::STATUS_PENDING, Invoice::STATUS_OVERDUE])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->subDays(15))
            ->get();

        foreach ($invoices as $invoice) {
            $existingActive = FollowUp::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('followable_type', Invoice::class)
                ->where('followable_id', $invoice->id)
                ->where('type', FollowUp::TYPE_INVOICE_UNPAID)
                ->active()
                ->exists();

            if ($existingActive) continue;

            $daysOverdue = now()->diffInDays($invoice->due_date);

            // Assign to accountant
            $accountant = User::where('company_id', $companyId)
                ->whereIn('role', ['accountant', 'manager'])
                ->first();

            FollowUp::create([
                'company_id'      => $companyId,
                'type'            => FollowUp::TYPE_INVOICE_UNPAID,
                'followable_type' => Invoice::class,
                'followable_id'   => $invoice->id,
                'assigned_to'     => $accountant?->id,
                'status'          => FollowUp::STATUS_PENDING,
                'priority'        => $daysOverdue >= 30 ? FollowUp::PRIORITY_CRITICAL : FollowUp::PRIORITY_HIGH,
                'note'            => "فاتورة #{$invoice->id} بمبلغ {$invoice->amount} {$invoice->currency} متأخرة {$daysOverdue} يوم",
                'due_date'        => now()->addDays(2),
                'auto_generated'  => true,
            ]);

            $created++;
        }

        return $created;
    }

    /**
     * Clients with no task/invoice activity in 30+ days.
     */
    public static function checkInactiveClients(int $companyId): int
    {
        $created = 0;

        $clients = Client::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        foreach ($clients as $client) {
            // Check last activity
            $lastTaskUpdate = Task::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('client_id', $client->id)
                ->max('updated_at');

            $lastInvoice = Invoice::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->whereHas('contract', fn($q) => $q->where('client_id', $client->id))
                ->max('created_at');

            $lastActivity = max($lastTaskUpdate, $lastInvoice, $client->updated_at);
            if (!$lastActivity) continue;

            $daysSinceActivity = now()->diffInDays($lastActivity);
            if ($daysSinceActivity < 30) continue;

            $existingActive = FollowUp::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->where('followable_type', Client::class)
                ->where('followable_id', $client->id)
                ->where('type', FollowUp::TYPE_CLIENT_INACTIVE)
                ->active()
                ->exists();

            if ($existingActive) continue;

            $salesUser = User::where('company_id', $companyId)
                ->whereIn('role', ['sales', 'manager'])
                ->first();

            FollowUp::create([
                'company_id'      => $companyId,
                'type'            => FollowUp::TYPE_CLIENT_INACTIVE,
                'followable_type' => Client::class,
                'followable_id'   => $client->id,
                'assigned_to'     => $salesUser?->id,
                'status'          => FollowUp::STATUS_PENDING,
                'priority'        => FollowUp::PRIORITY_MEDIUM,
                'note'            => "العميل \"{$client->name}\" لم يتم التواصل معه منذ {$daysSinceActivity} يوم",
                'due_date'        => now()->addDays(3),
                'auto_generated'  => true,
            ]);

            $created++;
        }

        return $created;
    }

    /**
     * Auto-resolve follow-ups when the underlying issue is fixed.
     */
    public static function autoResolveCompleted(int $companyId): int
    {
        $resolved = 0;

        // Resolve task follow-ups when task is completed
        $taskFollowUps = FollowUp::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->whereIn('type', [FollowUp::TYPE_TASK_OVERDUE, FollowUp::TYPE_TASK_STUCK, FollowUp::TYPE_TASK_NO_UPDATE])
            ->where('followable_type', Task::class)
            ->active()
            ->get();

        foreach ($taskFollowUps as $fu) {
            $task = Task::withoutGlobalScopes()->find($fu->followable_id);
            if ($task && $task->status === Task::STATUS_DONE) {
                $fu->resolve('تم إنجاز المهمة — أُغلقت المتابعة تلقائياً');
                $resolved++;
            }
        }

        // Resolve invoice follow-ups when invoice is paid
        $invoiceFollowUps = FollowUp::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('type', FollowUp::TYPE_INVOICE_UNPAID)
            ->where('followable_type', Invoice::class)
            ->active()
            ->get();

        foreach ($invoiceFollowUps as $fu) {
            $invoice = Invoice::withoutGlobalScopes()->find($fu->followable_id);
            if ($invoice && $invoice->status === Invoice::STATUS_PAID) {
                $fu->resolve('تم دفع الفاتورة — أُغلقت المتابعة تلقائياً');
                $resolved++;
            }
        }

        return $resolved;
    }
}
