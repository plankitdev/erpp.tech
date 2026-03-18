<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'company_id'   => $this->company_id,
            'category'     => $this->category,
            'amount'       => $this->amount,
            'currency'     => $this->currency,
            'date'         => $this->date?->format('Y-m-d'),
            'notes'        => $this->notes,
            'reference_id' => $this->reference_id,
            'created_at'   => $this->created_at?->toISOString(),
            'updated_at'   => $this->updated_at?->toISOString(),
        ];
    }
}
