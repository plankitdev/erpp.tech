<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isEmployee = $user && $user->role === 'employee';

        $data = [
            'id'                => $this->id,
            'name'              => $this->name,
            'slug'              => $this->slug,
            'phone'             => $this->phone,
            'company_name'      => $this->company_name,
            'sector'            => $this->sector,
            'service'           => $this->service,
            'status'            => $this->status,
            'notes'             => $this->notes,
            'active_contract'   => $this->whenLoaded('activeContract', fn() =>
                new ContractResource($this->activeContract)
            ),
            'contracts'         => ContractResource::collection($this->whenLoaded('contracts')),
            'projects'          => ProjectResource::collection($this->whenLoaded('projects')),
            'tasks'             => TaskResource::collection($this->whenLoaded('tasks')),
            'created_at'        => $this->created_at->format('Y-m-d'),
        ];

        if (!$isEmployee) {
            $data['monthly_payment']  = $this->monthly_payment ? (float) $this->monthly_payment : null;
            $data['payment_day']      = $this->payment_day;
            $data['total_outstanding'] = $this->total_outstanding;
            $data['total_expenses']   = $this->total_expenses;
            $data['total_paid']       = $this->total_paid;
        }

        return $data;
    }
}
