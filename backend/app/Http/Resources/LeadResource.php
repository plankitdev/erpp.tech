<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'name'               => $this->name,
            'phone'              => $this->phone,
            'email'              => $this->email,
            'source'             => $this->source,
            'service_type'       => $this->service_type,
            'expected_budget'    => $this->expected_budget,
            'stage'              => $this->stage,
            'first_contact_date' => $this->first_contact_date?->format('Y-m-d'),
            'last_followup_date' => $this->last_followup_date?->format('Y-m-d'),
            'notes'              => $this->notes,
            'proposal_file'      => $this->proposal_file,
            'proposed_amount'    => $this->proposed_amount,
            'final_amount'       => $this->final_amount,
            'assigned_to'        => $this->whenLoaded('assignee', fn () => [
                'id'   => $this->assignee->id,
                'name' => $this->assignee->name,
            ]),
            'converted_client_id' => $this->converted_client_id,
            'activities_count'   => $this->whenCounted('activities'),
            'activities'         => LeadActivityResource::collection($this->whenLoaded('activities')),
            'created_at'         => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
