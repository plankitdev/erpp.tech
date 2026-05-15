<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    use HasCompany, HasFactory;

    public const TYPE_ASSET = 'asset';
    public const TYPE_LIABILITY = 'liability';
    public const TYPE_EQUITY = 'equity';
    public const TYPE_REVENUE = 'revenue';
    public const TYPE_EXPENSE = 'expense';
    public const TYPES = [self::TYPE_ASSET, self::TYPE_LIABILITY, self::TYPE_EQUITY, self::TYPE_REVENUE, self::TYPE_EXPENSE];

    public const NATURE_DEBIT = 'debit';
    public const NATURE_CREDIT = 'credit';

    protected $fillable = [
        'company_id', 'parent_id', 'code', 'name', 'name_en',
        'type', 'nature', 'is_active', 'is_system', 'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_id');
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'account_id');
    }

    public function getBalanceAttribute(): float
    {
        $debits = $this->journalLines()
            ->whereHas('journalEntry', fn($q) => $q->where('status', 'posted'))
            ->sum('debit');
        $credits = $this->journalLines()
            ->whereHas('journalEntry', fn($q) => $q->where('status', 'posted'))
            ->sum('credit');

        return $this->nature === self::NATURE_DEBIT
            ? $debits - $credits
            : $credits - $debits;
    }
}
