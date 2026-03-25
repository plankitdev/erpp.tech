<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Installment extends Model
{
    use HasFactory, HasCompany, LogsActivity;

    protected $fillable = [
        'company_id',
        'contract_id',
        'installment_number',
        'amount',
        'currency',
        'due_date',
        'paid_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'datetime:Y-m-d',
        'paid_date' => 'datetime:Y-m-d',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    protected static function booted(): void
    {
        static::updated(function (Installment $installment) {
            if ($installment->isDirty('status') && $installment->status === 'paid') {
                $contract = $installment->contract;
                TreasuryTransaction::create([
                    'company_id'  => $installment->company_id,
                    'type'        => TreasuryTransaction::TYPE_IN,
                    'amount'      => $installment->amount,
                    'currency'    => $installment->currency ?? 'EGP',
                    'category'    => TreasuryTransaction::CATEGORY_REVENUE,
                    'date'        => $installment->paid_date ?? now(),
                    'description' => "قسط #{$installment->installment_number} - عقد #{$contract->id}",
                ]);
            }
        });
    }
}
