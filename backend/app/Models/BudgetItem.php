<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetItem extends Model
{
    protected $fillable = [
        'budget_id', 'account_id', 'cost_center_id', 'category',
        'month', 'planned_amount', 'actual_amount', 'notes',
    ];

    protected $casts = [
        'planned_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'month' => 'integer',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function getVarianceAttribute(): float
    {
        return $this->planned_amount - $this->actual_amount;
    }

    public function getVariancePercentAttribute(): float
    {
        return $this->planned_amount > 0
            ? round((($this->planned_amount - $this->actual_amount) / $this->planned_amount) * 100, 1)
            : 0;
    }
}
