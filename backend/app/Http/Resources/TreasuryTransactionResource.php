<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TreasuryTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'type'          => $this->type,
            'amount'        => $this->amount,
            'currency'      => $this->currency,
            'category'      => $this->category,
            'date'          => $this->date?->format('Y-m-d'),
            'description'   => $this->description,
            'balance_after' => $this->balance_after,
            'created_at'    => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
