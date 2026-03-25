<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('treasury');
    }

    public function view(User $user, Expense $expense): bool
    {
        return $user->canAccess('treasury');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('treasury');
    }

    public function update(User $user, Expense $expense): bool
    {
        return $user->canAccess('treasury');
    }

    public function delete(User $user, Expense $expense): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
