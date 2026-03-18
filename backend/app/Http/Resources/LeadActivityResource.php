<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'type'               => $this->type,
            'notes'              => $this->notes,
            'attachment'         => $this->attachment,
            'outcome'            => $this->outcome,
            'next_followup_date' => $this->next_followup_date?->format('Y-m-d'),
            'user'               => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'created_at'         => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
