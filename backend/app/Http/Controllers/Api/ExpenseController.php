<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Expense::class);

        $expenses = Expense::query()
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->currency, fn($q) => $q->where('currency', $request->currency))
            ->when($request->from, fn($q) => $q->where('date', '>=', $request->from))
            ->when($request->to, fn($q) => $q->where('date', '<=', $request->to))
            ->latest('date')
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($expenses);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $this->authorize('create', Expense::class);

        $expense = Expense::create($request->validated());

        NotificationService::expenseCreated($expense->company_id, $expense->category ?? '', number_format($expense->amount));

        return $this->successResponse(new ExpenseResource($expense), 'تم تسجيل المصروف بنجاح', 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        $this->authorize('view', $expense);

        return $this->successResponse(new ExpenseResource($expense));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $expense->update($request->validated());
        return $this->successResponse(new ExpenseResource($expense), 'تم تحديث المصروف');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);

        $expense->delete();
        return $this->successResponse(null, 'تم حذف المصروف');
    }
}
