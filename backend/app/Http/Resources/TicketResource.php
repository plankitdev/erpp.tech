<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'subject' => $this->subject,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->status,
            'category' => $this->category,
            'client' => $this->whenLoaded('client', fn() => [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ]),
            'project' => $this->whenLoaded('project', fn() => [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ]),
            'creator' => $this->whenLoaded('creator', fn() => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'assignee' => $this->whenLoaded('assignee', fn() => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'replies_count' => $this->whenCounted('replies'),
            'replies' => $this->whenLoaded('replies', fn() =>
                $this->replies->map(fn($r) => [
                    'id' => $r->id,
                    'body' => $r->body,
                    'is_internal' => $r->is_internal,
                    'user' => [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                    ],
                    'created_at' => $r->created_at->toISOString(),
                ])
            ),
            'resolved_at' => $this->resolved_at?->toISOString(),
            'closed_at' => $this->closed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
