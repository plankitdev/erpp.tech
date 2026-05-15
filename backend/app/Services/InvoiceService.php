<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Contract;
use App\Models\InvoicePayment;
use App\Models\TreasuryTransaction;
use Illuminate\Support\Carbon;

class InvoiceService
{
    public function generateMonthlyInvoices(): int
    {
        $contracts = Contract::where('status', 'active')
            ->where('payment_type', 'monthly')
            ->get();

        $count = 0;
        foreach ($contracts as $contract) {
            $existingInvoice = Invoice::where('contract_id', $contract->id)
                ->whereMonth('due_date', now()->month)
                ->whereYear('due_date', now()->year)
                ->exists();

            if (!$existingInvoice) {
                // Auto-set due_date based on client's payment_day
                $dueDate = now()->endOfMonth();
                $client = $contract->client;
                if ($client && $client->payment_day) {
                    $day = min($client->payment_day, now()->daysInMonth);
                    $dueDate = now()->day($day);
                    if ($dueDate->isPast()) {
                        $dueDate = $dueDate->addMonth()->day(min($client->payment_day, $dueDate->daysInMonth));
                    }
                }

                Invoice::create([
                    'contract_id' => $contract->id,
                    'company_id'  => $contract->company_id,
                    'client_id'   => $contract->client_id,
                    'amount'      => $contract->installment_amount ?? ($contract->value / 12),
                    'currency'    => $contract->currency,
                    'status'      => 'pending',
                    'issue_date'  => now()->toDateString(),
                    'due_date'    => $dueDate,
                ]);
                $count++;
            }
        }

        return $count;
    }

    public function recordPayment(Invoice $invoice, float $amount, ?string $notes = null): InvoicePayment
    {
        $payment = $invoice->payments()->create([
            'amount'  => $amount,
            'paid_at' => now(),
            'notes'   => $notes,
        ]);

        $totalPaid = $invoice->payments()->sum('amount');

        if ($totalPaid >= $invoice->amount) {
            $invoice->update([
                'status'    => 'paid',
                'paid_date' => now(),
            ]);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'partial']);
        }

        // Auto-create treasury transaction
        TreasuryTransaction::create([
            'company_id'  => $invoice->company_id,
            'type'        => 'in',
            'amount'      => $amount,
            'currency'    => $invoice->currency,
            'category'    => 'revenue',
            'date'        => now()->toDateString(),
            'description' => "تحصيل فاتورة #{$invoice->id}",
        ]);

        return $payment;
    }
}
