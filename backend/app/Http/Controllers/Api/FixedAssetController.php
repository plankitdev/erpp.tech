<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FixedAsset;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\ChartOfAccount;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FixedAssetController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = FixedAsset::with('costCenter')
            ->when($request->category, fn($q, $c) => $q->where('category', $c))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByDesc('purchase_date');

        return $this->paginatedResponse($query->paginate($this->getPerPage()));
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $data = $request->validate([
            'code'                 => "required|string|max:20|unique:fixed_assets,code,NULL,id,company_id,{$companyId}",
            'name'                 => 'required|string|max:255',
            'category'             => 'required|in:equipment,furniture,vehicles,electronics,property,other',
            'purchase_date'        => 'required|date',
            'purchase_cost'        => 'required|numeric|min:0',
            'salvage_value'        => 'nullable|numeric|min:0',
            'useful_life_months'   => 'required|integer|min:1',
            'depreciation_method'  => 'sometimes|in:straight_line,declining_balance',
            'location'             => 'nullable|string|max:255',
            'serial_number'        => 'nullable|string|max:100',
            'cost_center_id'       => 'nullable|exists:cost_centers,id',
            'notes'                => 'nullable|string',
        ], [
            'code.required'              => 'رمز الأصل مطلوب',
            'code.unique'                => 'رمز الأصل مستخدم بالفعل',
            'name.required'              => 'اسم الأصل مطلوب',
            'category.required'          => 'تصنيف الأصل مطلوب',
            'purchase_date.required'     => 'تاريخ الشراء مطلوب',
            'purchase_cost.required'     => 'تكلفة الشراء مطلوبة',
            'useful_life_months.required'=> 'العمر الافتراضي مطلوب',
        ]);

        $data['current_value'] = $data['purchase_cost'];
        $data['salvage_value'] = $data['salvage_value'] ?? 0;

        $asset = FixedAsset::create($data);
        return $this->successResponse($asset->load('costCenter'), 'تم إضافة الأصل بنجاح', 201);
    }

    public function show(FixedAsset $fixedAsset): JsonResponse
    {
        $fixedAsset->load('costCenter');
        $data = $fixedAsset->toArray();
        $data['monthly_depreciation'] = $fixedAsset->monthly_depreciation;
        $data['remaining_life_months'] = $fixedAsset->remaining_life_months;
        $data['depreciation_percent'] = $fixedAsset->depreciation_percent;

        return $this->successResponse($data);
    }

    public function update(Request $request, FixedAsset $fixedAsset): JsonResponse
    {
        $data = $request->validate([
            'name'                => 'sometimes|string|max:255',
            'category'            => 'sometimes|in:equipment,furniture,vehicles,electronics,property,other',
            'location'            => 'nullable|string|max:255',
            'serial_number'       => 'nullable|string|max:100',
            'status'              => 'sometimes|in:active,disposed,under_maintenance',
            'cost_center_id'      => 'nullable|exists:cost_centers,id',
            'notes'               => 'nullable|string',
            'disposed_date'       => 'nullable|date',
            'disposal_amount'     => 'nullable|numeric|min:0',
        ]);

        if (isset($data['status']) && $data['status'] === FixedAsset::STATUS_DISPOSED) {
            $data['disposed_date'] = $data['disposed_date'] ?? now()->toDateString();
        }

        $fixedAsset->update($data);
        return $this->successResponse($fixedAsset->fresh()->load('costCenter'), 'تم تحديث الأصل بنجاح');
    }

    public function destroy(FixedAsset $fixedAsset): JsonResponse
    {
        if ($fixedAsset->status === FixedAsset::STATUS_ACTIVE && $fixedAsset->accumulated_depreciation > 0) {
            return $this->errorResponse('لا يمكن حذف أصل نشط له إهلاك. يجب التخلص منه أولاً', 422);
        }

        $fixedAsset->delete();
        return $this->successResponse(null, 'تم حذف الأصل بنجاح');
    }

    public function depreciate(Request $request): JsonResponse
    {
        // Only admin can run depreciation
        if (!in_array(auth()->user()->role, ['super_admin', 'company_admin', 'manager'])) {
            return $this->errorResponse('غير مصرح لك بتنفيذ الإهلاك', 403);
        }

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $periodKey = "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT);

        $assets = FixedAsset::where('status', FixedAsset::STATUS_ACTIVE)->get();
        $count = 0;
        $totalDepreciation = 0;

        return DB::transaction(function () use ($assets, $periodKey, $month, $year, &$count, &$totalDepreciation) {
            foreach ($assets as $asset) {
                // Prevent double depreciation for same period
                if ($asset->last_depreciated_at === $periodKey) {
                    continue;
                }

                $monthly = $asset->monthly_depreciation;
                if ($monthly <= 0) continue;

                $newAccumulated = $asset->accumulated_depreciation + $monthly;
                $maxDepreciation = $asset->purchase_cost - $asset->salvage_value;

                if ($newAccumulated > $maxDepreciation) {
                    $monthly = $maxDepreciation - $asset->accumulated_depreciation;
                    $newAccumulated = $maxDepreciation;
                }

                if ($monthly > 0) {
                    $asset->update([
                        'accumulated_depreciation' => round($newAccumulated, 2),
                        'current_value' => round($asset->purchase_cost - $newAccumulated, 2),
                        'last_depreciated_at' => $periodKey,
                    ]);
                    $totalDepreciation += $monthly;
                    $count++;
                }
            }

            // Create journal entry for depreciation if any assets were depreciated
            if ($count > 0 && $totalDepreciation > 0) {
                $companyId = auth()->user()->company_id;

                // Find depreciation expense account (5203) and accumulated depreciation account (1299)
                $depExpenseAccount = ChartOfAccount::where('company_id', $companyId)->where('code', '5203')->first();
                $accDepAccount = ChartOfAccount::where('company_id', $companyId)->where('code', '1299')->first();

                if ($depExpenseAccount && $accDepAccount) {
                    $lastEntry = JournalEntry::where('company_id', $companyId)
                        ->lockForUpdate()->orderByDesc('id')->first();
                    $nextNumber = $lastEntry
                        ? 'JE-' . str_pad((int) str_replace('JE-', '', $lastEntry->entry_number) + 1, 6, '0', STR_PAD_LEFT)
                        : 'JE-000001';

                    $entry = JournalEntry::create([
                        'company_id'    => $companyId,
                        'entry_number'  => $nextNumber,
                        'date'          => "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . now()->format('d'),
                        'description'   => "إهلاك الأصول الثابتة - {$year}/{$month}",
                        'reference_type'=> 'depreciation',
                        'total_debit'   => round($totalDepreciation, 2),
                        'total_credit'  => round($totalDepreciation, 2),
                        'status'        => JournalEntry::STATUS_POSTED,
                        'created_by'    => auth()->id(),
                        'posted_by'     => auth()->id(),
                        'posted_at'     => now(),
                    ]);

                    $entry->lines()->create([
                        'account_id'  => $depExpenseAccount->id,
                        'debit'       => round($totalDepreciation, 2),
                        'credit'      => 0,
                        'description' => "مصروف إهلاك - {$year}/{$month}",
                    ]);

                    $entry->lines()->create([
                        'account_id'  => $accDepAccount->id,
                        'debit'       => 0,
                        'credit'      => round($totalDepreciation, 2),
                        'description' => "مجمع إهلاك - {$year}/{$month}",
                    ]);
                }
            }

            return $this->successResponse(
                ['depreciated_count' => $count, 'total_depreciation' => round($totalDepreciation, 2)],
                "تم حساب الإهلاك لـ {$count} أصل بنجاح"
            );
        });
    }

    public function summary(): JsonResponse
    {
        $byCategory = FixedAsset::select('category')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('ROUND(SUM(purchase_cost), 2) as total_cost')
            ->selectRaw('ROUND(SUM(current_value), 2) as total_current_value')
            ->selectRaw('ROUND(SUM(accumulated_depreciation), 2) as total_depreciation')
            ->groupBy('category')
            ->get()
            ->keyBy('category')
            ->map(fn($item) => [
                'count'                => $item->count,
                'total_cost'           => (float) $item->total_cost,
                'total_current_value'  => (float) $item->total_current_value,
                'total_depreciation'   => (float) $item->total_depreciation,
            ]);

        $totals = FixedAsset::selectRaw('COUNT(*) as total_assets')
            ->selectRaw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_assets")
            ->selectRaw('ROUND(SUM(purchase_cost), 2) as total_purchase_cost')
            ->selectRaw('ROUND(SUM(current_value), 2) as total_current_value')
            ->selectRaw('ROUND(SUM(accumulated_depreciation), 2) as total_accumulated_depreciation')
            ->first();

        $categoryLabels = [
            'equipment'   => 'المعدات',
            'furniture'   => 'الأثاث',
            'vehicles'    => 'السيارات',
            'electronics' => 'الأجهزة الإلكترونية',
            'property'    => 'العقارات',
            'other'       => 'أخرى',
        ];

        return $this->successResponse([
            'total_assets'              => (int) $totals->total_assets,
            'active_assets'             => (int) $totals->active_assets,
            'total_purchase_cost'       => (float) $totals->total_purchase_cost,
            'total_current_value'       => (float) $totals->total_current_value,
            'total_accumulated_depreciation' => (float) $totals->total_accumulated_depreciation,
            'by_category'               => $byCategory,
            'category_labels'           => $categoryLabels,
        ]);
    }
}
