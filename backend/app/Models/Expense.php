<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasCompany, HasFactory, LogsActivity;

    protected $fillable = ['company_id', 'project_id', 'category', 'amount', 'currency', 'date', 'notes', 'reference_id'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'datetime:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    protected static function booted(): void
    {
        static::created(function (Expense $expense) {
            TreasuryTransaction::create([
                'company_id'  => $expense->company_id,
                'type'        => TreasuryTransaction::TYPE_OUT,
                'amount'      => $expense->amount,
                'currency'    => $expense->currency ?? 'EGP',
                'category'    => 'expense',
                'date'        => $expense->date ?? now(),
                'description' => "مصروف: {$expense->category}" . ($expense->notes ? " - {$expense->notes}" : ''),
            ]);
        });
    }
}
