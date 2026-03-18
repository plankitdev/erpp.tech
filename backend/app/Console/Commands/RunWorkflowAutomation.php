<?php

namespace App\Console\Commands;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\WorkflowRule;
use App\Services\WorkflowService;
use Illuminate\Console\Command;

class RunWorkflowAutomation extends Command
{
    protected $signature = 'workflows:run';
    protected $description = 'تنفيذ قواعد الأتمتة المبنية على الوقت';

    public function handle(): int
    {
        $executed = 0;

        // Contract expiring (within next 14 days)
        $expiringContracts = Contract::with('client')
            ->where('status', Contract::STATUS_ACTIVE)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [now(), now()->addDays(14)])
            ->get();

        foreach ($expiringContracts as $contract) {
            $daysRemaining = (int) now()->diffInDays($contract->end_date, false);
            $count = WorkflowService::fire(
                WorkflowRule::TRIGGER_CONTRACT_EXPIRING,
                $contract->company_id,
                $contract,
                ['days_remaining' => $daysRemaining]
            );
            $executed += $count;
        }

        // Contract expired (end_date has passed, still active)
        $expiredContracts = Contract::with('client')
            ->where('status', Contract::STATUS_ACTIVE)
            ->whereNotNull('end_date')
            ->where('end_date', '<', now())
            ->get();

        foreach ($expiredContracts as $contract) {
            $count = WorkflowService::fire(
                WorkflowRule::TRIGGER_CONTRACT_EXPIRED,
                $contract->company_id,
                $contract
            );
            $executed += $count;
        }

        // Invoice overdue (past due_date, not paid)
        $overdueInvoices = Invoice::with('contract.client')
            ->whereIn('status', ['pending', 'partial'])
            ->where('due_date', '<', now())
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $count = WorkflowService::fire(
                WorkflowRule::TRIGGER_INVOICE_OVERDUE,
                $invoice->company_id,
                $invoice,
                ['days_overdue' => (int) now()->diffInDays($invoice->due_date)]
            );
            $executed += $count;
        }

        $this->info("تم تنفيذ {$executed} إجراء من قواعد الأتمتة");
        return self::SUCCESS;
    }
}
