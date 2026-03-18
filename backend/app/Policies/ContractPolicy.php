<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('clients');
    }

    public function view(User $user, Contract $contract): bool
    {
        return $user->canAccess('clients');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('clients');
    }

    public function update(User $user, Contract $contract): bool
    {
        return $user->canAccess('clients');
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
