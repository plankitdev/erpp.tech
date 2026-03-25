<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'title'                 => $this->title,
            'description'           => $this->description,
            'status'                => $this->status,
            'priority'              => $this->priority,
            'recurrence'            => $this->recurrence ?? 'none',
            'next_recurrence_date'  => $this->next_recurrence_date?->format('Y-m-d'),
            'due_date'              => $this->due_date?->format('Y-m-d'),
            'assigned_to'           => new UserResource($this->whenLoaded('assignedUser')),
            'assignees'             => UserResource::collection($this->whenLoaded('assignees')),
            'created_by'            => new UserResource($this->whenLoaded('creator')),
            'client'                => new ClientResource($this->whenLoaded('client')),
            'project'               => new ProjectResource($this->whenLoaded('project')),
            'parent_id'             => $this->parent_id,
            'parent'                => new TaskResource($this->whenLoaded('parent')),
            'subtasks'              => TaskResource::collection($this->whenLoaded('subtasks')),
            'subtasks_count'        => $this->subtasks_count ?? $this->whenCounted('subtasks'),
            'completed_subtasks_count' => $this->completed_subtasks_count ?? 0,
            'comments'              => TaskCommentResource::collection($this->whenLoaded('comments')),
            'files'                 => TaskFileResource::collection($this->whenLoaded('files')),
            'total_time'            => $this->total_time ?? 0,
            'start_date'            => $this->start_date?->format('Y-m-d'),
            'created_at'            => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
