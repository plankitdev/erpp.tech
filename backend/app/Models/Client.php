<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\HasTags;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Client extends Model
{
    use SoftDeletes, HasCompany, HasFactory, LogsActivity, HasTags;

    public const STATUS_ACTIVE   = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
    ];

    protected $fillable = [
        'company_id', 'name', 'slug', 'phone', 'company_name',
        'sector', 'service', 'monthly_payment', 'payment_day',
        'status', 'notes', 'last_contact_date', 'follow_up_days',
    ];

    protected $casts = [
        'last_contact_date' => 'date',
        'monthly_payment' => 'decimal:2',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::creating(function (Client $client) {
            if (empty($client->slug)) {
                $slug = \Illuminate\Support\Str::slug($client->name);
                $original = $slug;
                $i = 1;
                while (static::withoutGlobalScopes()->where('slug', $slug)->exists()) {
                    $slug = $original . '-' . $i++;
                }
                $client->slug = $slug;
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function activeContract(): HasOne
    {
        return $this->hasOne(Contract::class)->where('status', Contract::STATUS_ACTIVE)->latest();
    }

    public function invoices(): HasManyThrough
    {
        return $this->hasManyThrough(Invoice::class, Contract::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function directInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function getTotalOutstandingAttribute(): float
    {
        return $this->invoices()->where('invoices.status', '!=', Invoice::STATUS_PAID)->sum('invoices.amount');
    }

    public function getTotalExpensesAttribute(): float
    {
        return $this->expenses()->sum('amount');
    }

    public function getTotalPaidAttribute(): float
    {
        $throughContract = $this->invoices()
            ->where('invoices.status', Invoice::STATUS_PAID)
            ->sum('invoices.amount');
        $direct = $this->directInvoices()
            ->where('status', Invoice::STATUS_PAID)
            ->whereNull('contract_id')
            ->sum('amount');
        return $throughContract + $direct;
    }
}
