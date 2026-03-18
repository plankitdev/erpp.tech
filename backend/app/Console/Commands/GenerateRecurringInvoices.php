<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Notification;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Console\Command;

class GenerateRecurringInvoices extends Command
{
    protected $signature = 'invoices:generate-recurring';
    protected $description = 'توليد فواتير شهرية تلقائية للعقود النشطة';

    public function handle(): int
    {
        $service = new InvoiceService();
        $count = $service->generateMonthlyInvoices();

        if ($count > 0) {
            // Notify accountants about new recurring invoices
            $newInvoices = Invoice::where('status', 'pending')
                ->whereMonth('due_date', now()->month)
                ->whereYear('due_date', now()->year)
                ->get();

            foreach ($newInvoices as $invoice) {
                $users = User::where('company_id', $invoice->company_id)
                    ->whereIn('role', ['super_admin', 'accountant'])
                    ->get();

                foreach ($users as $user) {
                    $exists = Notification::where('user_id', $user->id)
                        ->where('type', 'invoice_generated')
                        ->where('link', "/invoices/{$invoice->id}")
                        ->where('created_at', '>=', now()->subDay())
                        ->exists();

                    if (!$exists) {
                        Notification::create([
                            'company_id' => $invoice->company_id,
                            'user_id' => $user->id,
                            'type' => 'invoice_generated',
                            'title' => 'فاتورة شهرية جديدة',
                            'body' => "تم توليد فاتورة بمبلغ {$invoice->amount} {$invoice->currency} تستحق في " . $invoice->due_date->format('Y-m-d'),
                            'link' => "/invoices/{$invoice->id}",
                        ]);
                    }
                }
            }
        }

        $this->info("تم توليد {$count} فاتورة شهرية");
        return self::SUCCESS;
    }
}
