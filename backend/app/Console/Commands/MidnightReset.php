<?php

namespace App\Console\Commands;

use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidnightReset extends Command
{
    protected $signature = 'attendance:midnight-reset';
    protected $description = 'تسجيل خروج تلقائي لجميع السجلات المفتوحة + إلغاء التوكنات (يعمل الساعة 12 صباحاً)';

    public function handle(): int
    {
        // 1) Auto-checkout: close all open attendance records
        $openRecords = AttendanceRecord::whereNull('check_out')
            ->whereNotNull('check_in')
            ->get();

        $count = 0;
        foreach ($openRecords as $record) {
            $checkIn = Carbon::parse($record->date->format('Y-m-d') . ' ' . $record->check_in);
            $checkOut = Carbon::parse($record->date->format('Y-m-d') . ' 23:59:00');
            $hours = round($checkIn->diffInMinutes($checkOut) / 60, 2);

            // Cap at 8 hours max for auto-checkout
            if ($hours > 8) {
                $hours = 8;
                $checkOut = $checkIn->copy()->addHours(8);
            }

            $record->update([
                'check_out' => $checkOut->format('H:i:s'),
                'hours_worked' => $hours,
                'notes' => trim(($record->notes ?? '') . ' [تسجيل خروج تلقائي]'),
            ]);
            $count++;
        }

        if ($count > 0) {
            Log::info("MidnightReset: تم تسجيل خروج تلقائي لـ {$count} سجل حضور");
            $this->info("تم تسجيل خروج تلقائي لـ {$count} سجل حضور");
        }

        // 2) Revoke all Sanctum tokens — forces re-login
        $tokensDeleted = DB::table('personal_access_tokens')->delete();

        if ($tokensDeleted > 0) {
            Log::info("MidnightReset: تم إلغاء {$tokensDeleted} توكن — يجب إعادة تسجيل الدخول");
            $this->info("تم إلغاء {$tokensDeleted} توكن");
        }

        $this->info('تمت عملية إعادة التعيين الليلية بنجاح');
        return self::SUCCESS;
    }
}
