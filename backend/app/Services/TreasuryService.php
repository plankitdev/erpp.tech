<?php

namespace App\Services;

use App\Models\TreasuryTransaction;

class TreasuryService
{
    public function getBalances(): array
    {
        return TreasuryTransaction::select('currency')
            ->selectRaw("SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) as balance")
            ->groupBy('currency')
            ->pluck('balance', 'currency')
            ->toArray();
    }

    public function createTransaction(array $data): TreasuryTransaction
    {
        $currentBalance = TreasuryTransaction::where('currency', $data['currency'])
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) as balance")
            ->value('balance');

        $newBalance = $data['type'] === 'in'
            ? $currentBalance + $data['amount']
            : $currentBalance - $data['amount'];

        $data['balance_after'] = $newBalance;

        return TreasuryTransaction::create($data);
    }
}
