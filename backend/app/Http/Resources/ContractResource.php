<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isEmployee = $user && $user->role === 'employee';

        $data = [
            'id'                 => $this->id,
            'client_id'          => $this->client_id,
            'client'             => new ClientResource($this->whenLoaded('client')),
            'payment_type'       => $this->payment_type,
            'start_date'         => $this->start_date?->format('Y-m-d'),
            'end_date'           => $this->end_date?->format('Y-m-d'),
            'status'             => $this->status,
            'notes'              => $this->notes,
            'invoices'           => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at'         => $this->created_at->format('Y-m-d'),
        ];

        if (!$isEmployee) {
            $data['value']              = (float) $this->value;
            $data['currency']           = $this->currency;
            $data['installments_count'] = $this->installments_count;
            $data['installment_amount'] = $this->installment_amount ? (float) $this->installment_amount : null;
        }

        return $data;
    }
}
