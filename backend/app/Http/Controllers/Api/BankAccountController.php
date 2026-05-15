<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\TreasuryTransaction;
use App\Services\TreasuryService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BankAccountController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = BankAccount::withCount('transactions')
            ->when($request->currency, fn($q, $c) => $q->where('currency', $c))
            ->when($request->has('active'), fn($q) => $q->where('is_active', $request->boolean('active')))
            ->orderBy('name');

        return $this->successResponse($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'bank_name'       => 'required|string|max:255',
            'account_number'  => 'nullable|string|max:50',
            'iban'            => 'nullable|string|max:50',
            'currency'        => 'sometimes|in:EGP,USD,SAR',
            'opening_balance' => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string',
        ], [
            'name.required'      => 'اسم الحساب مطلوب',
            'bank_name.required' => 'اسم البنك مطلوب',
        ]);

        $data['current_balance'] = $data['opening_balance'] ?? 0;
        $account = BankAccount::create($data);

        return $this->successResponse($account, 'تم إنشاء الحساب البنكي بنجاح', 201);
    }

    public function show(BankAccount $bankAccount): JsonResponse
    {
        $bankAccount->load(['transactions' => fn($q) => $q->orderByDesc('date')->limit(50)]);
        $bankAccount->unreconciled_count = $bankAccount->unreconciled_count;

        return $this->successResponse($bankAccount);
    }

    public function update(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'bank_name'      => 'sometimes|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'iban'           => 'nullable|string|max:50',
            'is_active'      => 'sometimes|boolean',
            'notes'          => 'nullable|string',
        ]);

        $bankAccount->update($data);
        return $this->successResponse($bankAccount->fresh(), 'تم تحديث الحساب البنكي بنجاح');
    }

    public function destroy(BankAccount $bankAccount): JsonResponse
    {
        if ($bankAccount->transactions()->exists()) {
            return $this->errorResponse('لا يمكن حذف حساب بنكي له معاملات', 422);
        }

        $bankAccount->delete();
        return $this->successResponse(null, 'تم حذف الحساب البنكي بنجاح');
    }

    // ========== Bank Transactions ==========

    public function transactions(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $query = $bankAccount->transactions()
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->from, fn($q, $d) => $q->where('date', '>=', $d))
            ->when($request->to, fn($q, $d) => $q->where('date', '<=', $d))
            ->when($request->has('reconciled'), fn($q) => $q->where('is_reconciled', $request->boolean('reconciled')))
            ->orderByDesc('date')->orderByDesc('id');

        return $this->paginatedResponse($query->paginate($this->getPerPage()));
    }

    public function addTransaction(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $data = $request->validate([
            'type'        => 'required|in:deposit,withdrawal,transfer',
            'amount'      => 'required|numeric|min:0.01',
            'date'        => 'required|date',
            'description' => 'nullable|string|max:500',
            'reference'   => 'nullable|string|max:100',
        ], [
            'type.required'   => 'نوع المعاملة مطلوب',
            'amount.required' => 'المبلغ مطلوب',
            'date.required'   => 'التاريخ مطلوب',
        ]);

        // Prevent negative balance on withdrawals/transfers
        if ($data['type'] !== BankTransaction::TYPE_DEPOSIT && $data['amount'] > $bankAccount->current_balance) {
            return $this->errorResponse('الرصيد غير كافي لإتمام هذه العملية', 422);
        }

        return DB::transaction(function () use ($data, $bankAccount) {
            $newBalance = $data['type'] === BankTransaction::TYPE_DEPOSIT
                ? $bankAccount->current_balance + $data['amount']
                : $bankAccount->current_balance - $data['amount'];

            // Create corresponding treasury transaction
            $treasuryService = new TreasuryService();
            $treasuryType = $data['type'] === BankTransaction::TYPE_DEPOSIT
                ? TreasuryTransaction::TYPE_IN
                : TreasuryTransaction::TYPE_OUT;
            $treasuryTx = $treasuryService->createTransaction([
                'company_id'  => $bankAccount->company_id,
                'type'        => $treasuryType,
                'amount'      => $data['amount'],
                'currency'    => $bankAccount->currency,
                'category'    => 'bank_transaction',
                'date'        => $data['date'],
                'description' => ($data['description'] ?? '') . " - {$bankAccount->name}",
            ]);

            $data['bank_account_id'] = $bankAccount->id;
            $data['balance_after'] = $newBalance;
            $data['treasury_transaction_id'] = $treasuryTx->id;

            $transaction = BankTransaction::create($data);
            $bankAccount->update(['current_balance' => $newBalance]);

            return $this->successResponse($transaction, 'تم تسجيل المعاملة بنجاح', 201);
        });
    }

    public function reconcile(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $data = $request->validate([
            'transaction_ids' => 'required|array|min:1',
            'transaction_ids.*' => 'exists:bank_transactions,id',
        ], [
            'transaction_ids.required' => 'يجب اختيار معاملات للتسوية',
        ]);

        $count = BankTransaction::where('bank_account_id', $bankAccount->id)
            ->whereIn('id', $data['transaction_ids'])
            ->where('is_reconciled', false)
            ->update([
                'is_reconciled' => true,
                'reconciled_at' => now(),
            ]);

        return $this->successResponse(
            ['reconciled_count' => $count],
            "تم تسوية {$count} معاملة بنجاح"
        );
    }
}
