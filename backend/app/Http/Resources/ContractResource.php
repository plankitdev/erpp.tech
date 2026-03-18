<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'client_id'          => $this->client_id,
            'client'             => new ClientResource($this->whenLoaded('client')),
            'value'              => (float) $this->value,
            'currency'           => $this->currency,
            'payment_type'       => $this->payment_type,
            'start_date'         => $this->start_date?->format('Y-m-d'),
            'end_date'           => $this->end_date?->format('Y-m-d'),
            'installments_count' => $this->installments_count,
            'installment_amount' => $this->installment_amount ? (float) $this->installment_amount : null,
            'status'             => $this->status,
            'notes'              => $this->notes,
            'invoices'           => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at'         => $this->created_at->format('Y-m-d'),
        ];
    }
}
