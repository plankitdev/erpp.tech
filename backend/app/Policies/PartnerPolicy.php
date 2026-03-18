<?php

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

class PartnerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('partners');
    }

    public function view(User $user, Partner $partner): bool
    {
        return $user->canAccess('partners');
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function update(User $user, Partner $partner): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function delete(User $user, Partner $partner): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
