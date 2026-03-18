<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'slug'          => $this->slug,
            'logo'          => $this->logo ? url($this->logo) : null,
            'icon'          => $this->icon ? url($this->icon) : null,
            'primary_color' => $this->primary_color,
            'is_active'     => $this->is_active,
            'users_count'   => $this->whenCounted('users'),
            'created_at'    => $this->created_at->format('Y-m-d'),
        ];
    }
}
