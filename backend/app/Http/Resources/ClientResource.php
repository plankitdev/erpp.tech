<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'phone'             => $this->phone,
            'company_name'      => $this->company_name,
            'sector'            => $this->sector,
            'service'           => $this->service,
            'status'            => $this->status,
            'notes'             => $this->notes,
            'total_outstanding' => $this->total_outstanding,
            'active_contract'   => $this->whenLoaded('activeContract', fn() =>
                new ContractResource($this->activeContract)
            ),
            'contracts'         => ContractResource::collection($this->whenLoaded('contracts')),
            'projects'          => ProjectResource::collection($this->whenLoaded('projects')),
            'tasks'             => TaskResource::collection($this->whenLoaded('tasks')),
            'created_at'        => $this->created_at->format('Y-m-d'),
        ];
    }
}
