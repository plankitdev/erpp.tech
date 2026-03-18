<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeFileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'file_name'   => $this->file_name,
            'file_path'   => $this->file_path,
            'type'        => $this->type,
            'uploaded_by' => new UserResource($this->whenLoaded('uploader')),
            'sent_at'     => $this->sent_at?->format('Y-m-d H:i'),
            'created_at'  => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
