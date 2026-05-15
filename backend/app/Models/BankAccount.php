<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
    use HasCompany, HasFactory;

    protected $fillable = [
        'company_id', 'name', 'bank_name', 'account_number',
        'iban', 'currency', 'opening_balance', 'current_balance',
        'is_active', 'notes',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function getUnreconciledCountAttribute(): int
    {
        return $this->transactions()->where('is_reconciled', false)->count();
    }
}
