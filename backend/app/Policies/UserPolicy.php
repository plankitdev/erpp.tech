<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function delete(User $user, User $model): bool
    {
        return $user->hasRole(['super_admin']);
    }

    public function resetPassword(User $user, User $model): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
