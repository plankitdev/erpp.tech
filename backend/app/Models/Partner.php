<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    use HasCompany, HasFactory, LogsActivity;

    protected $fillable = [
        'company_id', 'name', 'phone', 'bank_account',
        'share_percentage', 'capital', 'is_active',
    ];

    protected $casts = [
        'share_percentage' => 'decimal:2',
        'capital' => 'decimal:2',
        'is_active' => 'boolean',
        'bank_account' => 'encrypted',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PartnerPayment::class);
    }

    public function getTotalReceivedAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    public function getMonthlyReceived(int $month, int $year): float
    {
        return (float) $this->payments()
            ->where('month', $month)
            ->where('year', $year)
            ->sum('amount');
    }

    protected static function booted(): void
    {
        static::created(function (Partner $partner) {
            if ($partner->capital > 0) {
                TreasuryTransaction::create([
                    'company_id'  => $partner->company_id,
                    'type'        => TreasuryTransaction::TYPE_IN,
                    'amount'      => $partner->capital,
                    'currency'    => 'EGP',
                    'category'    => 'partner_capital',
                    'date'        => now(),
                    'description' => "رأس مال الشريك: {$partner->name}",
                ]);
            }
        });
    }
}
