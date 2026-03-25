<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskFileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'file_path'   => $this->file_path,
            'file_type'   => $this->file_type,
            'file_size'   => $this->file_size,
            'uploaded_by' => new UserResource($this->whenLoaded('uploader')),
            'created_at'  => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
