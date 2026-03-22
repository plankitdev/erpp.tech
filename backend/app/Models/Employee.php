<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use SoftDeletes, HasCompany, HasFactory, LogsActivity;

    protected $fillable = [
        'company_id', 'user_id', 'name', 'position',
        'phone', 'email', 'national_id', 'address',
        'bank_name', 'bank_account',
        'base_salary', 'join_date', 'contract_start', 'contract_end',
        'contract_file', 'notes',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'join_date' => 'datetime:Y-m-d',
        'contract_start' => 'datetime:Y-m-d',
        'contract_end' => 'datetime:Y-m-d',
        'national_id' => 'encrypted',
        'bank_account' => 'encrypted',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(EmployeeFile::class);
    }

    public function salaryPayments(): HasMany
    {
        return $this->hasMany(SalaryPayment::class);
    }
}
