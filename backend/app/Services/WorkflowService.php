<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Task;
use App\Models\WorkflowLog;
use App\Models\WorkflowRule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class WorkflowService
{
    /**
     * Fire a trigger and execute all matching active workflow rules.
     */
    public static function fire(string $trigger, int $companyId, Model $entity, array $context = []): int
    {
        $rules = WorkflowRule::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('trigger', $trigger)
            ->where('is_active', true)
            ->get();

        $executed = 0;
        foreach ($rules as $rule) {
            if (self::checkConditions($rule, $entity, $context)) {
                self::executeAction($rule, $companyId, $entity, $context);
                $executed++;
            }
        }

        return $executed;
    }

    /**
     * Check if rule conditions are met.
     */
    protected static function checkConditions(WorkflowRule $rule, Model $entity, array $context): bool
    {
        $conditions = $rule->conditions ?? [];

        // days_before condition (for time-based triggers)
        if (isset($conditions['days_before']) && isset($context['days_remaining'])) {
            if ($context['days_remaining'] > $conditions['days_before']) {
                return false;
            }
        }

        // min_value condition
        if (isset($conditions['min_value'])) {
            $value = $entity->value ?? $entity->amount ?? 0;
            if ($value < $conditions['min_value']) {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute the workflow action.
     */
    protected static function executeAction(WorkflowRule $rule, int $companyId, Model $entity, array $context): void
    {
        try {
            $result = match ($rule->action) {
                WorkflowRule::ACTION_CREATE_INVOICE => self::actionCreateInvoice($companyId, $entity, $rule->action_config ?? []),
                WorkflowRule::ACTION_CREATE_TASK => self::actionCreateTask($companyId, $entity, $rule->action_config ?? []),
                WorkflowRule::ACTION_SEND_NOTIFICATION => self::actionSendNotification($companyId, $entity, $rule->action_config ?? [], $context),
                WorkflowRule::ACTION_UPDATE_STATUS => self::actionUpdateStatus($entity, $rule->action_config ?? []),
                default => 'Unknown action',
            };

            self::logExecution($rule, $companyId, $entity, 'success', $result);
        } catch (\Throwable $e) {
            Log::error("Workflow execution failed: {$e->getMessage()}", [
                'rule_id' => $rule->id,
                'trigger' => $rule->trigger,
                'action' => $rule->action,
            ]);
            self::logExecution($rule, $companyId, $entity, 'failed', null, $e->getMessage());
        }
    }

    /**
     * Create an invoice from a contract.
     */
    protected static function actionCreateInvoice(int $companyId, Model $entity, array $config): string
    {
        if (!$entity instanceof Contract) {
            return 'Entity is not a contract';
        }

        $invoice = Invoice::create([
            'company_id' => $companyId,
            'contract_id' => $entity->id,
            'amount' => $config['amount'] ?? $entity->value,
            'currency' => $entity->currency,
            'status' => 'pending',
            'due_date' => now()->addDays($config['due_days'] ?? 14)->format('Y-m-d'),
        ]);

        NotificationService::notifyRoles(
            $companyId,
            ['super_admin', 'accountant'],
            'invoice_overdue',
            'فاتورة تلقائية جديدة',
            "تم إنشاء فاتورة تلقائية للعميل {$entity->client?->name} بمبلغ {$invoice->amount} {$invoice->currency}",
            "/invoices"
        );

        return "Invoice #{$invoice->id} created";
    }

    /**
     * Create a follow-up task.
     */
    protected static function actionCreateTask(int $companyId, Model $entity, array $config): string
    {
        $title = $config['task_title'] ?? 'متابعة تلقائية';

        // Build description based on entity type
        $description = match (true) {
            $entity instanceof Contract => "متابعة العقد - العميل: {$entity->client?->name}",
            $entity instanceof Invoice => "متابعة الفاتورة #{$entity->id} - المبلغ: {$entity->amount}",
            default => $config['task_description'] ?? null,
        };

        $task = Task::create([
            'company_id' => $companyId,
            'title' => $title,
            'description' => $description,
            'status' => 'todo',
            'priority' => $config['priority'] ?? 'medium',
            'due_date' => now()->addDays($config['due_days'] ?? 3)->format('Y-m-d'),
        ]);

        return "Task #{$task->id} created: {$title}";
    }

    /**
     * Send a notification to specified roles.
     */
    protected static function actionSendNotification(int $companyId, Model $entity, array $config, array $context): string
    {
        $roles = $config['roles'] ?? ['super_admin', 'manager'];
        $title = $config['title'] ?? 'إشعار أتمتة';
        $body = $config['body'] ?? '';

        // Replace placeholders in body
        $replacements = [
            '{entity_id}' => $entity->id,
            '{client_name}' => $entity->client?->name ?? $entity->name ?? '',
            '{amount}' => $entity->value ?? $entity->amount ?? '',
            '{status}' => $entity->status ?? '',
            '{days}' => $context['days_remaining'] ?? '',
        ];
        $body = str_replace(array_keys($replacements), array_values($replacements), $body);

        $count = NotificationService::notifyRoles($companyId, $roles, 'contract_expiring', $title, $body);

        return "Notified {$count} users";
    }

    /**
     * Update entity status.
     */
    protected static function actionUpdateStatus(Model $entity, array $config): string
    {
        $newStatus = $config['new_status'] ?? null;
        if (!$newStatus) {
            return 'No status specified';
        }

        $oldStatus = $entity->status;
        $entity->update(['status' => $newStatus]);

        return "Status changed from {$oldStatus} to {$newStatus}";
    }

    /**
     * Log workflow execution.
     */
    protected static function logExecution(WorkflowRule $rule, int $companyId, Model $entity, string $status, ?string $result = null, ?string $error = null): void
    {
        WorkflowLog::create([
            'company_id' => $companyId,
            'workflow_rule_id' => $rule->id,
            'trigger' => $rule->trigger,
            'action' => $rule->action,
            'status' => $status,
            'entity_type' => class_basename($entity),
            'entity_id' => $entity->id,
            'result' => $result,
            'error' => $error,
        ]);

        $rule->increment('executions_count');
        $rule->update(['last_executed_at' => now()]);
    }
}
