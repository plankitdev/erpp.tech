<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// تحديث الفواتير المتأخرة يومياً
Schedule::command('invoices:flag-overdue')->daily();

// توليد الفواتير الشهرية المتكررة أول كل شهر
Schedule::command('invoices:generate-recurring')->monthlyOn(1, '07:00');

// إرسال إشعارات تلقائية يومياً
Schedule::command('notifications:send-auto')->dailyAt('09:00');

// فحص العقود القاربة على الانتهاء يومياً
Schedule::command('contracts:check-expiring')->dailyAt('08:00');

// فحص متابعة العملاء يومياً
Schedule::command('clients:check-follow-ups')->dailyAt('10:00');

// تشغيل قواعد الأتمتة يومياً
Schedule::command('workflows:run')->dailyAt('08:30');

// معالجة المهام المتكررة يومياً
Schedule::command('tasks:process-recurring')->dailyAt('07:30');

// نسخ احتياطي يومي للداتابيز والملفات
Schedule::command('backup:run')->dailyAt('02:00');

// فحص صحة النظام كل 6 ساعات
Schedule::command('system:health-check')->everySixHours();
