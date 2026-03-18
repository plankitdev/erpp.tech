<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class CheckClientFollowUps extends Command
{
    protected $signature = 'clients:check-follow-ups';
    protected $description = 'إرسال إشعارات متابعة العملاء الذين لم يتم التواصل معهم';

    public function handle(): int
    {
        $count = 0;

        $clients = Client::where('status', Client::STATUS_ACTIVE)
            ->where(function ($q) {
                $q->whereNotNull('last_contact_date')
                    ->whereRaw('DATEDIFF(NOW(), last_contact_date) >= follow_up_days');
            })
            ->orWhere(function ($q) {
                $q->whereNull('last_contact_date')
                    ->where('created_at', '<=', now()->subDays(30));
            })
            ->get();

        foreach ($clients as $client) {
            $daysSince = $client->last_contact_date
                ? now()->diffInDays($client->last_contact_date)
                : now()->diffInDays($client->created_at);

            $users = User::where('company_id', $client->company_id)
                ->whereIn('role', ['super_admin', 'manager', 'sales'])
                ->get();

            foreach ($users as $user) {
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', 'client_follow_up')
                    ->where('link', "/clients/{$client->id}")
                    ->where('created_at', '>=', now()->subDays(7))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'company_id' => $client->company_id,
                        'user_id' => $user->id,
                        'type' => 'client_follow_up',
                        'title' => 'متابعة عميل مطلوبة',
                        'body' => "العميل {$client->name} لم يتم التواصل معه منذ {$daysSince} يوم",
                        'link' => "/clients/{$client->id}",
                    ]);
                    $count++;
                }
            }
        }

        $this->info("تم إرسال {$count} إشعار متابعة عملاء");
        return self::SUCCESS;
    }
}
