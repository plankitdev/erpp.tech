<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('invoices');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->canAccess('invoices');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('invoices');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->canAccess('invoices');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }

    public function recordPayment(User $user, Invoice $invoice): bool
    {
        return $user->canAccess('invoices');
    }
}
