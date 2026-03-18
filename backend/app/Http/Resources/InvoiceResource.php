<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'contract_id' => $this->contract_id,
            'contract'    => new ContractResource($this->whenLoaded('contract')),
            'amount'      => (float) $this->amount,
            'currency'    => $this->currency,
            'status'      => $this->status,
            'due_date'    => $this->due_date,
            'paid_date'   => $this->paid_date,
            'paid_amount' => (float) ($this->paid_amount ?? $this->payments()->sum('amount')),
            'remaining'   => (float) ($this->remaining ?? $this->amount - $this->payments()->sum('amount')),
            'payments'    => InvoicePaymentResource::collection($this->whenLoaded('payments')),
            'created_at'  => $this->created_at->format('Y-m-d'),
        ];
    }
}
