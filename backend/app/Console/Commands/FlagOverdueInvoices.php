<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class FlagOverdueInvoices extends Command
{
    protected $signature = 'invoices:flag-overdue';
    protected $description = 'تحديث حالة الفواتير المتأخرة تلقائياً وإرسال إشعارات';

    public function handle(): int
    {
        $overdueInvoices = Invoice::with('contract.client')
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $invoice->update(['status' => 'overdue']);

            $clientName = $invoice->contract?->client?->name ?? 'غير محدد';
            $daysOverdue = now()->diffInDays($invoice->due_date);

            $users = User::where('company_id', $invoice->company_id)
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
                        'company_id' => $invoice->company_id,
                        'user_id' => $user->id,
                        'type' => Notification::TYPE_INVOICE_OVERDUE,
                        'title' => 'فاتورة أصبحت متأخرة',
                        'body' => "فاتورة العميل {$clientName} بمبلغ {$invoice->amount} {$invoice->currency} متأخرة منذ {$daysOverdue} يوم",
                        'link' => "/invoices/{$invoice->id}",
                    ]);
                }
            }
        }

        $count = $overdueInvoices->count();
        $this->info("تم تحديث {$count} فاتورة متأخرة وإرسال الإشعارات");
        return self::SUCCESS;
    }
}
