<?php

namespace App\Console\Commands;

use App\Models\Expense;
use App\Models\Installment;
use App\Models\InvoicePayment;
use App\Models\SalaryPayment;
use App\Models\TreasuryTransaction;
use Illuminate\Console\Command;

class SyncAllToTreasury extends Command
{
    protected $signature = 'treasury:sync-all';
    protected $description = 'Sync all existing financial records (invoice payments, salaries, expenses, installments) to treasury';

    public function handle(): int
    {
        $this->info('Starting treasury sync...');

        // 1. Invoice Payments
        $invoicePayments = InvoicePayment::with('invoice')->get();
        $synced = 0;
        foreach ($invoicePayments as $payment) {
            $invoice = $payment->invoice;
            if (!$invoice) continue;

            $exists = TreasuryTransaction::where('company_id', $invoice->company_id)
                ->where('category', 'revenue')
                ->where('description', 'like', "%فاتورة #{$invoice->id}%")
                ->where('amount', $payment->amount)
                ->exists();

            if ($exists) continue;

            TreasuryTransaction::create([
                'company_id'  => $invoice->company_id,
                'type'        => TreasuryTransaction::TYPE_IN,
                'amount'      => $payment->amount,
                'currency'    => $invoice->currency ?? 'EGP',
                'category'    => 'revenue',
                'date'        => $payment->paid_at ?? $invoice->paid_date ?? now(),
                'description' => "تحصيل فاتورة #{$invoice->id}",
            ]);
            $synced++;
        }
        $this->info("  Invoice payments synced: {$synced}");

        // 2. Salary Payments
        $salaries = SalaryPayment::with('employee')->get();
        $synced = 0;
        foreach ($salaries as $salary) {
            $exists = TreasuryTransaction::where('company_id', $salary->company_id)
                ->where('category', 'salaries')
                ->where('description', 'like', "%{$salary->employee->name}%شهر {$salary->month}/{$salary->year}%")
                ->exists();

            if ($exists) continue;

            TreasuryTransaction::create([
                'company_id'  => $salary->company_id,
                'type'        => TreasuryTransaction::TYPE_OUT,
                'amount'      => $salary->total,
                'currency'    => 'EGP',
                'category'    => 'salaries',
                'date'        => $salary->payment_date ?? now(),
                'description' => "راتب: {$salary->employee->name} - شهر {$salary->month}/{$salary->year}",
            ]);
            $synced++;
        }
        $this->info("  Salary payments synced: {$synced}");

        // 3. Expenses
        $expenses = Expense::all();
        $synced = 0;
        foreach ($expenses as $expense) {
            $exists = TreasuryTransaction::where('company_id', $expense->company_id)
                ->where('category', 'expense')
                ->where('amount', $expense->amount)
                ->where('date', $expense->date)
                ->where('description', 'like', "%{$expense->category}%")
                ->exists();

            if ($exists) continue;

            TreasuryTransaction::create([
                'company_id'  => $expense->company_id,
                'type'        => TreasuryTransaction::TYPE_OUT,
                'amount'      => $expense->amount,
                'currency'    => $expense->currency ?? 'EGP',
                'category'    => 'expense',
                'date'        => $expense->date ?? now(),
                'description' => "مصروف: {$expense->category}" . ($expense->notes ? " - {$expense->notes}" : ''),
            ]);
            $synced++;
        }
        $this->info("  Expenses synced: {$synced}");

        // 4. Installments (paid only)
        $installments = Installment::where('status', 'paid')->with('contract')->get();
        $synced = 0;
        foreach ($installments as $installment) {
            $contract = $installment->contract;
            if (!$contract) continue;

            $exists = TreasuryTransaction::where('company_id', $installment->company_id)
                ->where('category', 'revenue')
                ->where('description', 'like', "%قسط #{$installment->installment_number}%عقد #{$contract->id}%")
                ->exists();

            if ($exists) continue;

            TreasuryTransaction::create([
                'company_id'  => $installment->company_id,
                'type'        => TreasuryTransaction::TYPE_IN,
                'amount'      => $installment->amount,
                'currency'    => $installment->currency ?? 'EGP',
                'category'    => 'revenue',
                'date'        => $installment->paid_date ?? now(),
                'description' => "قسط #{$installment->installment_number} - عقد #{$contract->id}",
            ]);
            $synced++;
        }
        $this->info("  Installments synced: {$synced}");

        $this->info('Treasury sync complete!');
        return 0;
    }
}
