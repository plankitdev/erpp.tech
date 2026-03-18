<?php

namespace App\Console\Commands;

use App\Models\Contract;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class CheckExpiringContracts extends Command
{
    protected $signature = 'contracts:check-expiring';
    protected $description = 'إرسال إشعارات عند اقتراب انتهاء العقود';

    public function handle(): int
    {
        $count = 0;

        // Contracts expiring within 14 days
        $expiringContracts = Contract::with('client')
            ->where('status', Contract::STATUS_ACTIVE)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [now(), now()->addDays(14)])
            ->get();

        foreach ($expiringContracts as $contract) {
            $companyId = $contract->company_id;
            $clientName = $contract->client?->name ?? 'غير محدد';
            $daysLeft = now()->diffInDays($contract->end_date);
            $label = $daysLeft <= 1 ? 'غداً' : "خلال {$daysLeft} يوم";

            $users = User::where('company_id', $companyId)
                ->whereIn('role', ['super_admin', 'manager', 'sales'])
                ->get();

            foreach ($users as $user) {
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', 'contract_expiring')
                    ->where('link', "/contracts/{$contract->id}/edit")
                    ->where('created_at', '>=', now()->subDays(3))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'company_id' => $companyId,
                        'user_id' => $user->id,
                        'type' => 'contract_expiring',
                        'title' => 'عقد قارب على الانتهاء',
                        'body' => "عقد العميل {$clientName} ينتهي {$label} (تاريخ الانتهاء: {$contract->end_date->format('Y-m-d')})",
                        'link' => "/contracts/{$contract->id}/edit",
                    ]);
                    $count++;
                }
            }
        }

        $this->info("تم إرسال {$count} إشعار لعقود قاربت على الانتهاء");
        return self::SUCCESS;
    }
}
