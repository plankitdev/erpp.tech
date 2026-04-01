<?php

namespace App\Console\Commands;

use App\Models\GoogleDriveToken;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncGoogleDrive extends Command
{
    protected $signature = 'drive:sync';
    protected $description = 'مزامنة تلقائية لجميع الشركات المتصلة بجوجل درايف';

    public function handle(): int
    {
        $tokens = GoogleDriveToken::whereNotNull('drive_folder_id')->get();

        if ($tokens->isEmpty()) {
            $this->info('لا توجد شركات متصلة بجوجل درايف');
            return self::SUCCESS;
        }

        $this->info("بدء المزامنة لـ {$tokens->count()} شركة...");

        foreach ($tokens as $token) {
            try {
                $driveService = GoogleDriveService::forCompany($token->company_id);
                if (!$driveService) {
                    $this->warn("شركة #{$token->company_id}: فشل الاتصال (token منتهي أو غير صالح)");
                    continue;
                }

                $result = $driveService->twoWaySync();

                $pushed = $result['pushed'] ?? 0;
                $pulled = $result['pulled'] ?? 0;
                $deleted = $result['deleted'] ?? 0;

                $this->info("شركة #{$token->company_id}: رفع {$pushed} / استيراد {$pulled} / حذف {$deleted}");

                Log::info("drive:sync — company #{$token->company_id}", $result);
            } catch (\Exception $e) {
                $this->error("شركة #{$token->company_id}: خطأ — {$e->getMessage()}");
                Log::error("drive:sync failed for company #{$token->company_id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info('تمت المزامنة');
        return self::SUCCESS;
    }
}
