<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use Illuminate\Console\Command;

class FlagOverdueInvoices extends Command
{
    protected $signature = 'invoices:flag-overdue';
    protected $description = 'تحديث حالة الفواتير المتأخرة تلقائياً';

    public function handle(): int
    {
        $count = Invoice::where('status', 'pending')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);

        $this->info("تم تحديث {$count} فاتورة متأخرة");
        return self::SUCCESS;
    }
}
