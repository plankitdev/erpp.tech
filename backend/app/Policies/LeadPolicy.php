<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('sales');
    }

    public function view(User $user, Lead $lead): bool
    {
        return $user->canAccess('sales');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('sales');
    }

    public function update(User $user, Lead $lead): bool
    {
        return $user->canAccess('sales');
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $user->canAccess('sales');
    }
}
