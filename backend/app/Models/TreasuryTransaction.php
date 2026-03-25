<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreasuryTransaction extends Model
{
    use HasCompany, HasFactory, LogsActivity;

    public const TYPE_IN  = 'in';
    public const TYPE_OUT = 'out';
    public const TYPES = [
        self::TYPE_IN,
        self::TYPE_OUT,
    ];

    public const CATEGORY_SALARIES         = 'salaries';
    public const CATEGORY_CLIENT_EXPENSE   = 'client_expense';
    public const CATEGORY_REVENUE          = 'revenue';
    public const CATEGORY_PARTNER_PAYMENT  = 'partner_payment';
    public const CATEGORY_PARTNER_CAPITAL  = 'partner_capital';
    public const CATEGORY_EXPENSE          = 'expense';
    public const CATEGORIES = [
        self::CATEGORY_SALARIES,
        self::CATEGORY_CLIENT_EXPENSE,
        self::CATEGORY_REVENUE,
        self::CATEGORY_PARTNER_PAYMENT,
        self::CATEGORY_PARTNER_CAPITAL,
        self::CATEGORY_EXPENSE,
    ];

    protected $fillable = [
        'company_id', 'type', 'amount', 'currency',
        'category', 'date', 'description', 'balance_after',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'date' => 'datetime:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
