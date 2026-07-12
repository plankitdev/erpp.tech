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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
        'company_id', 'name', 'slug', 'phone', 'email', 'company_name',
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

    /**
     * All invoice IDs belonging to this client, de-duplicated across the two
     * linkage paths: via a contract (hasManyThrough) and direct (client_id with
     * no contract). Contract-linked invoices also carry client_id, so we union
     * on the contract path and only add purely-direct invoices to avoid
     * double-counting.
     */
    protected function invoiceIds(): Collection
    {
        $viaContract = $this->invoices()->pluck('invoices.id');
        $direct = $this->directInvoices()->whereNull('contract_id')->pluck('id');
        return $viaContract->merge($direct)->unique()->values();
    }

    /**
     * Total invoiced amount. Uses total_with_vat when present, otherwise falls
     * back to the base amount (older invoices left total_with_vat null).
     */
    public function getTotalInvoicedAttribute(): float
    {
        $ids = $this->invoiceIds();
        if ($ids->isEmpty()) {
            return 0.0;
        }
        return (float) Invoice::whereIn('id', $ids)
            ->sum(DB::raw('COALESCE(total_with_vat, amount)'));
    }

    /**
     * Sum of actual payments recorded against this client's invoices.
     */
    public function getTotalPaidAttribute(): float
    {
        $ids = $this->invoiceIds();
        if ($ids->isEmpty()) {
            return 0.0;
        }
        return (float) InvoicePayment::whereIn('invoice_id', $ids)->sum('amount');
    }

    /**
     * Outstanding balance = Σ invoices − Σ payments. Correctly reflects partial
     * payments (unlike a status-based sum).
     */
    public function getTotalOutstandingAttribute(): float
    {
        return round($this->total_invoiced - $this->total_paid, 2);
    }

    public function getTotalExpensesAttribute(): float
    {
        return $this->expenses()->sum('amount');
    }
}
