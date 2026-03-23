<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('clients');
    }

    public function view(User $user, Client $client): bool
    {
        return $user->canAccess('clients');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('clients');
    }

    public function update(User $user, Client $client): bool
    {
        return $user->canAccess('clients');
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function deleteAny(User $user): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
