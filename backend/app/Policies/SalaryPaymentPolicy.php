<?php

namespace App\Policies;

use App\Models\SalaryPayment;
use App\Models\User;

class SalaryPaymentPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->canAccess('salaries')) {
            return true;
        }

        return $user->canAccess('salary.own');
    }

    public function view(User $user, SalaryPayment $salary): bool
    {
        if ($user->canAccess('salaries')) {
            return true;
        }

        if ($user->canAccess('salary.own')) {
            $employee = $salary->employee;
            return $employee && $employee->user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->canAccess('salaries');
    }

    public function update(User $user, SalaryPayment $salary): bool
    {
        return $user->canAccess('salaries');
    }
}
