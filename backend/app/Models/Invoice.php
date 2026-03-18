<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasCompany, HasFactory, LogsActivity;

    public const STATUS_PENDING  = 'pending';
    public const STATUS_PAID     = 'paid';
    public const STATUS_OVERDUE  = 'overdue';
    public const STATUS_PARTIAL  = 'partial';
    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
        self::STATUS_OVERDUE,
        self::STATUS_PARTIAL,
    ];

    protected $fillable = [
        'contract_id', 'company_id', 'amount', 'currency',
        'status', 'due_date', 'paid_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'datetime:Y-m-d',
        'paid_date' => 'datetime:Y-m-d',
    ];

    protected $appends = ['paid_amount', 'remaining'];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function getPaidAmountAttribute(): float
    {
        return $this->relationLoaded('payments')
            ? $this->payments->sum('amount')
            : $this->payments()->sum('amount');
    }

    public function getRemainingAttribute(): float
    {
        return $this->amount - $this->paid_amount;
    }
}
