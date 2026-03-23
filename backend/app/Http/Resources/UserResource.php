<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'permissions' => $this->getEffectivePermissions(),
            'phone'      => $this->phone,
            'avatar'     => $this->avatar ? asset('storage/' . $this->avatar) : null,
            'is_active'  => $this->is_active,
            'company_id' => $this->company_id,
            'company'    => new CompanyResource($this->whenLoaded('company')),
            'last_login_at' => $this->last_login_at?->format('Y-m-d H:i'),
            'created_at' => $this->created_at->format('Y-m-d'),
        ];
    }
}
