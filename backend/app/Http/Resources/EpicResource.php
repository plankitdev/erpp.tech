<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'project_id'            => $this->project_id,
            'title'                 => $this->title,
            'description'           => $this->description,
            'color'                 => $this->color,
            'status'                => $this->status,
            'sort_order'            => $this->sort_order,
            'created_by'            => new UserResource($this->whenLoaded('creator')),
            'tasks_count'           => $this->tasks_count ?? $this->whenCounted('tasks'),
            'completed_tasks_count' => $this->completed_tasks_count ?? 0,
            'progress'              => $this->progress ?? 0,
            'created_at'            => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
