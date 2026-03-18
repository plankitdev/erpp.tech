<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'phone'                => $this->phone,
            'bank_account'         => $this->bank_account,
            'share_percentage'     => $this->share_percentage,
            'capital'              => (float) $this->capital,
            'is_active'            => $this->is_active,
            'payments_count'       => $this->whenCounted('payments'),
            'payments_sum_amount'  => $this->when(
                isset($this->payments_sum_amount),
                fn() => (float) $this->payments_sum_amount
            ),
            'created_at'           => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
