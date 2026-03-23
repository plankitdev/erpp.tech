<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryPayment extends Model
{
    use HasCompany, HasFactory;

    protected $fillable = [
        'company_id', 'employee_id', 'month', 'year', 'base_salary',
        'bonus', 'bonus_reason',
        'deductions', 'deduction_reason', 'total',
        'transfer_amount', 'remaining', 'payment_date',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'bonus' => 'decimal:2',
        'deductions' => 'decimal:2',
        'total' => 'decimal:2',
        'transfer_amount' => 'decimal:2',
        'remaining' => 'decimal:2',
        'payment_date' => 'datetime:Y-m-d',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    protected static function booted(): void
    {
        static::created(function (SalaryPayment $salary) {
            TreasuryTransaction::create([
                'company_id'  => $salary->company_id,
                'type'        => TreasuryTransaction::TYPE_OUT,
                'amount'      => $salary->total,
                'currency'    => 'EGP',
                'category'    => TreasuryTransaction::CATEGORY_SALARIES,
                'date'        => $salary->payment_date ?? now(),
                'description' => "راتب: {$salary->employee->name} - شهر {$salary->month}/{$salary->year}",
            ]);
        });
    }
}
