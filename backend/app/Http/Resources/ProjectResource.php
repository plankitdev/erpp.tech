<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isEmployee = $user && $user->role === 'employee';

        $data = [
            'id'                    => $this->id,
            'slug'                  => $this->slug,
            'name'                  => $this->name,
            'description'           => $this->description,
            'status'                => $this->status,
            'start_date'            => $this->start_date?->format('Y-m-d'),
            'end_date'              => $this->end_date?->format('Y-m-d'),
            'client'                => new ClientResource($this->whenLoaded('client')),
            'created_by'            => new UserResource($this->whenLoaded('creator')),
            'tasks_count'           => $this->whenCounted('tasks', $this->tasks_count ?? 0),
            'completed_tasks_count' => $this->completed_tasks_count ?? 0,
            'progress'              => $this->progress ?? 0,
            'files_count'           => $this->whenCounted('files', $this->files_count ?? 0),
            'tasks'                 => TaskResource::collection($this->whenLoaded('tasks')),
            'files'                 => ProjectFileResource::collection($this->whenLoaded('files')),
            'created_at'            => $this->created_at?->format('Y-m-d H:i'),
        ];

        if (!$isEmployee) {
            $data['budget']   = $this->budget;
            $data['currency'] = $this->currency;
        }

        return $data;
    }
}
