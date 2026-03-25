<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoicePayment extends Model
{
    use LogsActivity;
    protected $fillable = ['invoice_id', 'amount', 'paid_at', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    protected static function booted(): void
    {
        static::created(function (InvoicePayment $payment) {
            $invoice = $payment->invoice;
            TreasuryTransaction::create([
                'company_id'  => $invoice->company_id,
                'type'        => TreasuryTransaction::TYPE_IN,
                'amount'      => $payment->amount,
                'currency'    => $invoice->currency ?? 'EGP',
                'category'    => TreasuryTransaction::CATEGORY_REVENUE,
                'date'        => $payment->paid_at ?? now(),
                'description' => "تحصيل فاتورة #{$invoice->id}",
            ]);
        });
    }
}
