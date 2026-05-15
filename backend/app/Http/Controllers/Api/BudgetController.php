<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\BudgetItem;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Budget::with('creator')
            ->when($request->year, fn($q, $y) => $q->where('year', $y))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->withCount('items')
            ->orderByDesc('year');

        return $this->paginatedResponse($query->paginate($this->getPerPage()));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'year'         => 'required|integer|min:2020|max:2099',
            'total_amount' => 'nullable|numeric|min:0',
            'notes'        => 'nullable|string',
            'items'        => 'nullable|array',
            'items.*.category'       => 'required|string|max:255',
            'items.*.account_id'     => 'nullable|exists:chart_of_accounts,id',
            'items.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'items.*.month'          => 'required|integer|min:1|max:12',
            'items.*.planned_amount' => 'required|numeric|min:0',
            'items.*.notes'          => 'nullable|string',
        ], [
            'name.required' => 'اسم الموازنة مطلوب',
            'year.required' => 'السنة مطلوبة',
        ]);

        return DB::transaction(function () use ($data) {
            $budget = Budget::create([
                'name'         => $data['name'],
                'year'         => $data['year'],
                'total_amount' => $data['total_amount'] ?? 0,
                'notes'        => $data['notes'] ?? null,
                'created_by'   => auth()->id(),
            ]);

            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $budget->items()->create($item);
                }
                $budget->update(['total_amount' => $budget->items()->sum('planned_amount')]);
            }

            return $this->successResponse(
                $budget->load(['items', 'creator']),
                'تم إنشاء الموازنة بنجاح',
                201
            );
        });
    }

    public function show(Budget $budget): JsonResponse
    {
        $budget->load(['items.account', 'items.costCenter', 'creator', 'approver']);

        // Calculate actual spending per item
        $items = $budget->items->map(function ($item) {
            return [
                ...$item->toArray(),
                'variance' => $item->variance,
                'variance_percent' => $item->variance_percent,
            ];
        });

        $data = $budget->toArray();
        $data['items'] = $items;
        $data['total_planned'] = $budget->total_planned;
        $data['total_actual'] = $budget->total_actual;
        $data['variance'] = $budget->variance;

        return $this->successResponse($data);
    }

    public function update(Request $request, Budget $budget): JsonResponse
    {
        if ($budget->status === Budget::STATUS_CLOSED) {
            return $this->errorResponse('لا يمكن تعديل موازنة مغلقة', 422);
        }

        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'total_amount' => 'nullable|numeric|min:0',
            'notes'        => 'nullable|string',
            'items'        => 'nullable|array',
            'items.*.id'             => 'nullable|exists:budget_items,id',
            'items.*.category'       => 'required|string|max:255',
            'items.*.account_id'     => 'nullable|exists:chart_of_accounts,id',
            'items.*.cost_center_id' => 'nullable|exists:cost_centers,id',
            'items.*.month'          => 'required|integer|min:1|max:12',
            'items.*.planned_amount' => 'required|numeric|min:0',
            'items.*.notes'          => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data, $budget) {
            $budget->update(collect($data)->only(['name', 'total_amount', 'notes'])->toArray());

            if (isset($data['items'])) {
                $existingItemIds = [];
                foreach ($data['items'] as $item) {
                    if (!empty($item['id'])) {
                        // Update existing item, preserving actual_amount
                        $budgetItem = $budget->items()->find($item['id']);
                        if ($budgetItem) {
                            $budgetItem->update(collect($item)->only(['category', 'account_id', 'cost_center_id', 'month', 'planned_amount', 'notes'])->toArray());
                            $existingItemIds[] = $budgetItem->id;
                        }
                    } else {
                        // Create new item
                        $newItem = $budget->items()->create($item);
                        $existingItemIds[] = $newItem->id;
                    }
                }
                // Delete items that were removed
                $budget->items()->whereNotIn('id', $existingItemIds)->delete();
                $budget->update(['total_amount' => $budget->items()->sum('planned_amount')]);
            }

            return $this->successResponse(
                $budget->fresh()->load(['items', 'creator']),
                'تم تحديث الموازنة بنجاح'
            );
        });
    }

    public function destroy(Budget $budget): JsonResponse
    {
        if (in_array($budget->status, [Budget::STATUS_APPROVED, Budget::STATUS_CLOSED])) {
            return $this->errorResponse('لا يمكن حذف موازنة معتمدة أو مغلقة', 422);
        }

        $budget->items()->delete();
        $budget->delete();

        return $this->successResponse(null, 'تم حذف الموازنة بنجاح');
    }

    public function approve(Budget $budget): JsonResponse
    {
        // Only admin/manager can approve budgets
        if (!in_array(auth()->user()->role, ['super_admin', 'company_admin', 'manager'])) {
            return $this->errorResponse('غير مصرح لك باعتماد الموازنات', 403);
        }

        if ($budget->status !== Budget::STATUS_DRAFT) {
            return $this->errorResponse('يمكن اعتماد الموازنات المسودة فقط', 422);
        }

        $budget->update([
            'status'      => Budget::STATUS_APPROVED,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return $this->successResponse($budget->fresh(), 'تم اعتماد الموازنة بنجاح');
    }

    public function comparison(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);

        $budget = Budget::where('year', $year)
            ->where('status', '!=', Budget::STATUS_DRAFT)
            ->with('items')
            ->first();

        if (!$budget) {
            return $this->successResponse([
                'has_budget' => false,
                'message'    => 'لا توجد موازنة معتمدة لهذه السنة',
            ]);
        }

        $monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        $monthlyComparison = [];
        for ($m = 1; $m <= 12; $m++) {
            $planned = $budget->items->where('month', $m)->sum('planned_amount');
            $actual = \App\Models\TreasuryTransaction::where('type', 'out')
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $monthlyComparison[] = [
                'month'      => $m,
                'month_name' => $monthNames[$m - 1],
                'planned'    => round($planned, 2),
                'actual'     => round($actual, 2),
                'variance'   => round($planned - $actual, 2),
                'status'     => $actual > $planned ? 'over' : 'under',
            ];
        }

        return $this->successResponse([
            'has_budget'         => true,
            'budget'             => $budget,
            'monthly_comparison' => $monthlyComparison,
            'total_planned'      => collect($monthlyComparison)->sum('planned'),
            'total_actual'       => collect($monthlyComparison)->sum('actual'),
            'total_variance'     => collect($monthlyComparison)->sum('variance'),
        ]);
    }
}
