<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\LogsActivity;

class FixedAsset extends Model
{
    use HasCompany, HasFactory, LogsActivity;

    public const CATEGORY_EQUIPMENT = 'equipment';
    public const CATEGORY_FURNITURE = 'furniture';
    public const CATEGORY_VEHICLES = 'vehicles';
    public const CATEGORY_ELECTRONICS = 'electronics';
    public const CATEGORY_PROPERTY = 'property';
    public const CATEGORY_OTHER = 'other';
    public const CATEGORIES = [
        self::CATEGORY_EQUIPMENT, self::CATEGORY_FURNITURE, self::CATEGORY_VEHICLES,
        self::CATEGORY_ELECTRONICS, self::CATEGORY_PROPERTY, self::CATEGORY_OTHER,
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_DISPOSED = 'disposed';
    public const STATUS_MAINTENANCE = 'under_maintenance';

    public const METHOD_STRAIGHT_LINE = 'straight_line';
    public const METHOD_DECLINING = 'declining_balance';

    protected $fillable = [
        'company_id', 'code', 'name', 'category', 'purchase_date',
        'purchase_cost', 'salvage_value', 'useful_life_months',
        'depreciation_method', 'accumulated_depreciation', 'current_value',
        'location', 'serial_number', 'status', 'disposed_date',
        'disposal_amount', 'cost_center_id', 'notes', 'last_depreciated_at',
    ];

    protected $casts = [
        'purchase_cost' => 'decimal:2',
        'salvage_value' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
        'current_value' => 'decimal:2',
        'disposal_amount' => 'decimal:2',
        'purchase_date' => 'datetime:Y-m-d',
        'disposed_date' => 'datetime:Y-m-d',
        'useful_life_months' => 'integer',
    ];

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function getMonthlyDepreciationAttribute(): float
    {
        if ($this->depreciation_method === self::METHOD_STRAIGHT_LINE) {
            $depreciableAmount = $this->purchase_cost - $this->salvage_value;
            return $this->useful_life_months > 0
                ? round($depreciableAmount / $this->useful_life_months, 2)
                : 0;
        }

        // Declining balance
        $rate = 2 / $this->useful_life_months;
        return round($this->current_value * $rate, 2);
    }

    public function getRemainingLifeMonthsAttribute(): int
    {
        if ($this->status !== self::STATUS_ACTIVE) return 0;
        $purchaseDate = $this->purchase_date;
        $monthsUsed = $purchaseDate->diffInMonths(now());
        return max(0, $this->useful_life_months - $monthsUsed);
    }

    public function getDepreciationPercentAttribute(): float
    {
        return $this->purchase_cost > 0
            ? round(($this->accumulated_depreciation / $this->purchase_cost) * 100, 1)
            : 0;
    }
}
