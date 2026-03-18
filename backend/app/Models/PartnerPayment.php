<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerPayment extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'partner_id', 'amount', 'currency',
        'month', 'year', 'payment_date', 'type', 'notes', 'receipt_file',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'datetime:Y-m-d',
        'month' => 'integer',
        'year' => 'integer',
    ];

    public const TYPE_PROFIT_SHARE         = 'profit_share';
    public const TYPE_ADVANCE              = 'advance';
    public const TYPE_EXPENSE              = 'expense';
    public const TYPE_WITHDRAWAL           = 'withdrawal';
    public const TYPE_CAPITAL_CONTRIBUTION = 'capital_contribution';
    public const TYPE_DEPOSIT              = 'deposit';

    public const TYPES = [
        self::TYPE_PROFIT_SHARE,
        self::TYPE_ADVANCE,
        self::TYPE_EXPENSE,
        self::TYPE_WITHDRAWAL,
        self::TYPE_CAPITAL_CONTRIBUTION,
        self::TYPE_DEPOSIT,
    ];

    /** Types where money flows INTO the company from the partner */
    public const INFLOW_TYPES = [
        self::TYPE_CAPITAL_CONTRIBUTION,
        self::TYPE_DEPOSIT,
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    protected static function booted(): void
    {
        static::created(function (PartnerPayment $payment) {
            $isInflow = in_array($payment->type, self::INFLOW_TYPES);
            $typeLabel = match($payment->type) {
                'profit_share' => 'توزيع أرباح',
                'advance' => 'سلفة',
                'expense' => 'مصروفات',
                'withdrawal' => 'سحب',
                'capital_contribution' => 'إيداع رأس مال',
                'deposit' => 'إيداع',
                default => $payment->type,
            };

            TreasuryTransaction::create([
                'company_id'  => $payment->company_id,
                'type'        => $isInflow ? TreasuryTransaction::TYPE_IN : TreasuryTransaction::TYPE_OUT,
                'amount'      => $payment->amount,
                'currency'    => $payment->currency,
                'category'    => $isInflow ? 'partner_capital' : 'partner_payment',
                'date'        => $payment->payment_date,
                'description' => ($isInflow ? "إيداع من الشريك: " : "دفعة للشريك: ") . "{$payment->partner->name} - {$typeLabel}",
            ]);
        });
    }
}
