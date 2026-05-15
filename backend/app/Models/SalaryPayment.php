<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryPayment extends Model
{
    use HasCompany, HasFactory, LogsActivity;

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
        // Create treasury transaction only when salary is actually paid (has payment_date)
        static::created(function (SalaryPayment $salary) {
            if ($salary->payment_date && $salary->transfer_amount > 0) {
                TreasuryTransaction::create([
                    'company_id'  => $salary->company_id,
                    'type'        => TreasuryTransaction::TYPE_OUT,
                    'amount'      => $salary->transfer_amount,
                    'currency'    => 'EGP',
                    'category'    => TreasuryTransaction::CATEGORY_SALARIES,
                    'date'        => $salary->payment_date ?? now(),
                    'description' => "راتب: {$salary->employee->name} - شهر {$salary->month}/{$salary->year}",
                ]);
            }
        });

        // Also handle marking as paid via update
        static::updated(function (SalaryPayment $salary) {
            if ($salary->isDirty('payment_date') && $salary->payment_date && $salary->transfer_amount > 0) {
                // Check no treasury entry was already created for this salary
                $exists = TreasuryTransaction::where('company_id', $salary->company_id)
                    ->where('category', TreasuryTransaction::CATEGORY_SALARIES)
                    ->where('description', 'LIKE', "%{$salary->employee->name}%شهر {$salary->month}/{$salary->year}%")
                    ->exists();

                if (!$exists) {
                    TreasuryTransaction::create([
                        'company_id'  => $salary->company_id,
                        'type'        => TreasuryTransaction::TYPE_OUT,
                        'amount'      => $salary->transfer_amount,
                        'currency'    => 'EGP',
                        'category'    => TreasuryTransaction::CATEGORY_SALARIES,
                        'date'        => $salary->payment_date,
                        'description' => "راتب: {$salary->employee->name} - شهر {$salary->month}/{$salary->year}",
                    ]);
                }
            }
        });
    }
}
