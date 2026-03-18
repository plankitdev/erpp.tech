<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuotationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'subject' => $this->subject,
            'description' => $this->description,
            'items' => $this->items,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'currency' => $this->currency,
            'status' => $this->status,
            'valid_until' => $this->valid_until?->format('Y-m-d'),
            'notes' => $this->notes,
            'terms' => $this->terms,
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'company_name' => $this->client->company_name,
            ]),
            'lead' => $this->whenLoaded('lead', fn () => [
                'id' => $this->lead->id,
                'name' => $this->lead->name,
                'company_name' => $this->lead->company_name,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
