<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\FollowUpService;
use Illuminate\Console\Command;

class GenerateFollowUps extends Command
{
    protected $signature = 'followups:generate {--company= : Generate for specific company ID}';
    protected $description = 'Auto-generate smart follow-ups for overdue tasks, expiring contracts, etc.';

    public function handle(): int
    {
        $this->info('🔄 Generating smart follow-ups...');

        $companies = $this->option('company')
            ? Company::where('id', $this->option('company'))->get()
            : Company::all();

        $totalGenerated = 0;
        $totalResolved = 0;

        foreach ($companies as $company) {
            $this->line("  📦 {$company->name}:");

            // Auto-resolve completed items first
            $resolved = FollowUpService::autoResolveCompleted($company->id);
            $totalResolved += $resolved;
            if ($resolved > 0) {
                $this->line("    ✅ Auto-resolved: {$resolved}");
            }

            // Generate new follow-ups
            $stats = FollowUpService::generateForCompany($company->id);
            $companyTotal = array_sum($stats);
            $totalGenerated += $companyTotal;

            foreach ($stats as $type => $count) {
                if ($count > 0) {
                    $this->line("    📋 {$type}: {$count}");
                }
            }

            if ($companyTotal === 0 && $resolved === 0) {
                $this->line("    ✨ No new follow-ups needed");
            }
        }

        $this->newLine();
        $this->info("✅ Done! Generated: {$totalGenerated} | Auto-resolved: {$totalResolved}");

        return Command::SUCCESS;
    }
}
