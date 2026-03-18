<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoicePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'      => $this->id,
            'amount'  => (float) $this->amount,
            'paid_at' => $this->paid_at,
            'notes'   => $this->notes,
        ];
    }
}
