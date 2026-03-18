<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use HasCompany, SoftDeletes, HasFactory, LogsActivity;

    public const STATUS_ACTIVE    = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    public const PAYMENT_TYPE_MONTHLY      = 'monthly';
    public const PAYMENT_TYPE_INSTALLMENTS = 'installments';
    public const PAYMENT_TYPES = [
        self::PAYMENT_TYPE_MONTHLY,
        self::PAYMENT_TYPE_INSTALLMENTS,
    ];

    protected $fillable = [
        'client_id', 'company_id', 'value', 'currency',
        'payment_type', 'start_date', 'end_date',
        'installments_count', 'installment_amount',
        'status', 'notes',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'start_date' => 'datetime:Y-m-d',
        'end_date' => 'datetime:Y-m-d',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }
}
