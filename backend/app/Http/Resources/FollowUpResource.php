<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowUpResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'type'            => $this->type,
            'type_label'      => $this->type_label,
            'status'          => $this->status,
            'priority'        => $this->priority,
            'priority_label'  => $this->priority_label,
            'note'            => $this->note,
            'due_date'        => $this->due_date?->format('Y-m-d H:i'),
            'resolved_at'     => $this->resolved_at?->format('Y-m-d H:i'),
            'auto_generated'  => $this->auto_generated,
            'assigned_to'     => $this->whenLoaded('assignedUser', fn() => [
                'id'   => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ]),
            'created_by'      => $this->whenLoaded('creator', fn() => [
                'id'   => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'followable_type' => class_basename($this->followable_type),
            'followable_id'   => $this->followable_id,
            'followable'      => $this->whenLoaded('followable', function () {
                $f = $this->followable;
                return match (class_basename($f)) {
                    'Task'     => ['id' => $f->id, 'title' => $f->title, 'status' => $f->status, 'due_date' => $f->due_date?->format('Y-m-d')],
                    'Contract' => ['id' => $f->id, 'title' => $f->title ?? "عقد #{$f->id}", 'status' => $f->status, 'end_date' => $f->end_date?->format('Y-m-d')],
                    'Invoice'  => ['id' => $f->id, 'title' => "فاتورة #{$f->id}", 'status' => $f->status, 'amount' => $f->amount, 'currency' => $f->currency],
                    'Client'   => ['id' => $f->id, 'title' => $f->name, 'status' => $f->status],
                    default    => ['id' => $f->id],
                };
            }),
            'is_overdue'      => $this->due_date && $this->due_date->isPast() && in_array($this->status, ['pending', 'in_progress']),
            'created_at'      => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
