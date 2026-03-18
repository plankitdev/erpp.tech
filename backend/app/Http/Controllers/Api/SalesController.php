<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    use ApiResponse;

    public function dashboard(): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        // Pipeline stats by stage
        $pipeline = Lead::select('stage', DB::raw('COUNT(*) as count'), DB::raw('COALESCE(SUM(expected_budget), 0) as total_budget'))
            ->groupBy('stage')
            ->get()
            ->keyBy('stage');

        // Total leads
        $totalLeads = Lead::count();

        // Conversion rate
        $convertedCount = Lead::whereNotNull('converted_client_id')->count();
        $conversionRate = $totalLeads > 0 ? round(($convertedCount / $totalLeads) * 100, 1) : 0;

        // Leads needing followup (last followup > 3 days ago or null)
        $stuckLeads = Lead::whereNull('converted_client_id')
            ->where(function ($q) {
                $q->whereNull('last_followup_date')
                  ->orWhere('last_followup_date', '<', now()->subDays(3));
            })
            ->whereNotIn('stage', [Lead::STAGE_CONTRACT_SIGNED, Lead::STAGE_LOST])
            ->count();

        // Lost leads count
        $lostLeads = Lead::where('stage', Lead::STAGE_LOST)->count();

        // New leads this month
        $newThisMonth = Lead::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Leads by source
        $bySource = Lead::select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->pluck('count', 'source');

        // Leads by service type
        $byService = Lead::select('service_type', DB::raw('COUNT(*) as count'))
            ->groupBy('service_type')
            ->pluck('count', 'service_type');

        // Team performance (leads per assignee)
        $teamPerformance = Lead::select('assigned_to', DB::raw('COUNT(*) as total'))
            ->with('assignee:id,name')
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->get()
            ->map(fn ($item) => [
                'user_id' => $item->assigned_to,
                'name' => $item->assignee?->name ?? 'غير محدد',
                'total' => $item->total,
            ]);

        return $this->successResponse([
            'total_leads'     => $totalLeads,
            'conversion_rate' => $conversionRate,
            'stuck_leads'     => $stuckLeads,
            'lost_leads'      => $lostLeads,
            'new_this_month'  => $newThisMonth,
            'pipeline'        => $pipeline,
            'by_source'       => $bySource,
            'by_service'      => $byService,
            'team_performance' => $teamPerformance,
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $month = (int) $request->input('month', now()->month);
        $year  = (int) $request->input('year', now()->year);

        // Summary for selected month
        $totalLeads = Lead::whereMonth('created_at', $month)->whereYear('created_at', $year)->count();
        $convertedLeads = Lead::whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->whereNotNull('converted_client_id')->count();
        $conversionRate = $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 1) : 0;
        $totalContractValue = Lead::whereMonth('created_at', $month)->whereYear('created_at', $year)
            ->whereNotNull('converted_client_id')->sum('final_amount');
        $avgContractValue = $convertedLeads > 0 ? round((float) $totalContractValue / $convertedLeads, 2) : 0;

        // Per-sales performance
        $salesPerformance = Lead::select(
                'assigned_to',
                DB::raw('COUNT(*) as leads_count'),
                DB::raw('SUM(CASE WHEN converted_client_id IS NOT NULL THEN 1 ELSE 0 END) as converted_count'),
                DB::raw('COALESCE(SUM(CASE WHEN converted_client_id IS NOT NULL THEN final_amount ELSE 0 END), 0) as total_value')
            )
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->whereNotNull('assigned_to')
            ->with('assignee:id,name')
            ->groupBy('assigned_to')
            ->get()
            ->map(fn ($item) => [
                'user_id'         => $item->assigned_to,
                'name'            => $item->assignee?->name ?? 'غير محدد',
                'leads_count'     => (int) $item->leads_count,
                'converted_count' => (int) $item->converted_count,
                'total_value'     => (float) $item->total_value,
                'conversion_rate' => $item->leads_count > 0
                    ? round(($item->converted_count / $item->leads_count) * 100, 1) : 0,
            ]);

        // Leads by source for selected month
        $bySource = Lead::select('source', DB::raw('COUNT(*) as count'))
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->groupBy('source')
            ->pluck('count', 'source');

        // Conversion trend (last 6 months ending at selected month)
        $conversionTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $d = now()->setYear($year)->setMonth($month)->startOfMonth()->subMonths($i);
            $m = $d->month;
            $y = $d->year;
            $total = Lead::whereMonth('created_at', $m)->whereYear('created_at', $y)->count();
            $converted = Lead::whereMonth('created_at', $m)->whereYear('created_at', $y)
                ->whereNotNull('converted_client_id')->count();
            $conversionTrend[] = [
                'month'       => $y . '-' . str_pad($m, 2, '0', STR_PAD_LEFT),
                'label'       => $d->translatedFormat('M Y'),
                'total_leads' => $total,
                'converted'   => $converted,
                'rate'        => $total > 0 ? round(($converted / $total) * 100, 1) : 0,
            ];
        }

        return $this->successResponse([
            'summary' => [
                'total_leads'          => $totalLeads,
                'converted_leads'      => $convertedLeads,
                'conversion_rate'      => $conversionRate,
                'total_contract_value' => (float) $totalContractValue,
                'avg_contract_value'   => $avgContractValue,
            ],
            'sales_performance' => $salesPerformance,
            'by_source'         => $bySource,
            'conversion_trend'  => $conversionTrend,
        ]);
    }
}
