<?php

namespace App\Policies;

use App\Models\TreasuryTransaction;
use App\Models\User;

class TreasuryTransactionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('treasury');
    }

    public function view(User $user, TreasuryTransaction $transaction): bool
    {
        return $user->canAccess('treasury');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('treasury');
    }
}
