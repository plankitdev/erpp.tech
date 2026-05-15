<?php

namespace App\Console\Commands;

use App\Models\Installment;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class FlagOverdueInstallments extends Command
{
    protected $signature = 'installments:flag-overdue';
    protected $description = 'تحديث حالة الأقساط المتأخرة تلقائياً وإرسال إشعارات';

    public function handle(): int
    {
        $overdueInstallments = Installment::with('contract.client')
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->get();

        foreach ($overdueInstallments as $installment) {
            $installment->update(['status' => 'overdue']);

            $contract = $installment->contract;
            $clientName = $contract?->client?->name ?? 'غير محدد';
            $daysOverdue = now()->diffInDays($installment->due_date);

            $users = User::where('company_id', $installment->company_id)
                ->whereIn('role', ['super_admin', 'manager', 'accountant'])
                ->get();

            foreach ($users as $user) {
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', 'installment_overdue')
                    ->where('link', "/contracts/{$contract?->id}")
                    ->where('created_at', '>=', now()->subDays(3))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'company_id' => $installment->company_id,
                        'user_id'    => $user->id,
                        'type'       => 'installment_overdue',
                        'title'      => 'قسط متأخر عن السداد',
                        'body'       => "القسط رقم {$installment->installment_number} للعميل {$clientName} بمبلغ {$installment->amount} {$installment->currency} متأخر منذ {$daysOverdue} يوم",
                        'link'       => "/contracts/{$contract?->id}",
                    ]);
                }
            }
        }

        $count = $overdueInstallments->count();
        $this->info("تم تحديث {$count} قسط متأخر وإرسال الإشعارات");
        return self::SUCCESS;
    }
}
