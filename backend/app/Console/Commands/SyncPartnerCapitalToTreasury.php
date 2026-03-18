<?php

namespace App\Console\Commands;

use App\Models\Partner;
use App\Models\TreasuryTransaction;
use Illuminate\Console\Command;

class SyncPartnerCapitalToTreasury extends Command
{
    protected $signature = 'partners:sync-capital';
    protected $description = 'Sync existing partner capital amounts to treasury transactions';

    public function handle(): int
    {
        $partners = Partner::where('capital', '>', 0)->get();

        if ($partners->isEmpty()) {
            $this->info('No partners with capital found.');
            return 0;
        }

        $synced = 0;
        foreach ($partners as $partner) {
            // Check if already synced
            $exists = TreasuryTransaction::where('company_id', $partner->company_id)
                ->where('category', 'partner_capital')
                ->where('description', 'like', "%{$partner->name}%")
                ->exists();

            if ($exists) {
                $this->line("  Skipped: {$partner->name} (already synced)");
                continue;
            }

            TreasuryTransaction::create([
                'company_id'  => $partner->company_id,
                'type'        => TreasuryTransaction::TYPE_IN,
                'amount'      => $partner->capital,
                'currency'    => 'EGP',
                'category'    => 'partner_capital',
                'date'        => $partner->created_at,
                'description' => "رأس مال الشريك: {$partner->name}",
            ]);

            $this->info("  Synced: {$partner->name} — {$partner->capital} EGP");
            $synced++;
        }

        $this->info("Done. Synced {$synced} partner(s) capital to treasury.");
        return 0;
    }
}
