<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasCompany, HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'company_id', 'name', 'year', 'status', 'total_amount',
        'notes', 'created_by', 'approved_by', 'approved_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'year' => 'integer',
        'approved_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(BudgetItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getTotalPlannedAttribute(): float
    {
        return $this->items()->sum('planned_amount');
    }

    public function getTotalActualAttribute(): float
    {
        return $this->items()->sum('actual_amount');
    }

    public function getVarianceAttribute(): float
    {
        return $this->total_planned - $this->total_actual;
    }
}
