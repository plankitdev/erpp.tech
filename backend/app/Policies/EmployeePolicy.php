<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Employee $employee): bool
    {
        // Only super admin or the employee's own user can view
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($employee->user_id && $employee->user_id === $user->id) {
            return true;
        }

        return $user->hasRole(['manager']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
