<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// تحديث الفواتير المتأخرة يومياً
Schedule::command('invoices:flag-overdue')->daily();

// إرسال إشعارات تلقائية يومياً
Schedule::command('notifications:send-auto')->dailyAt('09:00');

// فحص العقود القاربة على الانتهاء يومياً
Schedule::command('contracts:check-expiring')->dailyAt('08:00');
