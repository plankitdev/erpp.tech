<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTreasuryTransactionRequest;
use App\Http\Resources\TreasuryTransactionResource;
use App\Models\TreasuryTransaction;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TreasuryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TreasuryTransaction::class);

        $query = TreasuryTransaction::orderByDesc('date')->orderByDesc('id');

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        if ($currency = $request->input('currency')) {
            $query->where('currency', $currency);
        }
        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }
        if ($from = $request->input('from')) {
            $query->where('date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('date', '<=', $to);
        }

        $transactions = $query->paginate($this->getPerPage(50));

        return $this->paginatedResponse($transactions);
    }

    public function show(TreasuryTransaction $treasury): JsonResponse
    {
        $this->authorize('view', $treasury);

        return $this->successResponse(new TreasuryTransactionResource($treasury));
    }

    public function balance(): JsonResponse
    {
        $this->authorize('viewAny', TreasuryTransaction::class);

        $balances = TreasuryTransaction::select('currency')
            ->selectRaw("SUM(CASE WHEN type = '" . TreasuryTransaction::TYPE_IN . "' THEN amount ELSE -amount END) as balance")
            ->groupBy('currency')
            ->pluck('balance', 'currency')
            ->toArray();

        return $this->successResponse($balances);
    }

    public function store(StoreTreasuryTransactionRequest $request): JsonResponse
    {
        $this->authorize('create', TreasuryTransaction::class);

        $data = $request->validated();

        $currentBalance = TreasuryTransaction::where('currency', $data['currency'])
            ->selectRaw("COALESCE(SUM(CASE WHEN type = '" . TreasuryTransaction::TYPE_IN . "' THEN amount ELSE -amount END), 0) as balance")
            ->value('balance');

        $newBalance = $data['type'] === TreasuryTransaction::TYPE_IN
            ? $currentBalance + $data['amount']
            : $currentBalance - $data['amount'];

        $data['balance_after'] = $newBalance;

        $transaction = TreasuryTransaction::create($data);

        return $this->successResponse(new TreasuryTransactionResource($transaction), 'تم تسجيل المعاملة بنجاح', 201);
    }
}
