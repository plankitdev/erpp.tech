<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\Task;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to = $request->input('to', now()->endOfMonth()->toDateString());

        $userId = $request->user()->id;
        $isEmployee = $request->user()->role === 'employee';

        // Tasks with due dates in range
        $tasksQuery = Task::with(['assignedUser', 'project'])
            ->whereBetween('due_date', [$from, $to]);

        if ($isEmployee) {
            $tasksQuery->where(function ($q) use ($userId) {
                $q->where('assigned_to', $userId)
                  ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
            });
        }

        $tasks = $tasksQuery->get()->map(fn($t) => [
            'id' => $t->id,
            'title' => $t->title,
            'type' => 'task',
            'start' => $t->start_date?->format('Y-m-d') ?? $t->due_date->format('Y-m-d'),
            'end' => $t->due_date->format('Y-m-d'),
            'status' => $t->status,
            'priority' => $t->priority,
            'project' => $t->project?->name,
            'assignee' => $t->assignedUser?->name,
        ]);

        // Meetings in range
        $meetingsQuery = Meeting::with(['creator', 'participants', 'project'])
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('start_time', [$from, $to . ' 23:59:59'])
                  ->orWhereBetween('end_time', [$from, $to . ' 23:59:59']);
            });

        if ($isEmployee) {
            $meetingsQuery->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)
                  ->orWhereHas('participants', fn($q2) => $q2->where('user_id', $userId));
            });
        }

        $meetings = $meetingsQuery->get()->map(fn($m) => [
            'id' => $m->id,
            'title' => $m->title,
            'type' => 'meeting',
            'start' => $m->start_time->format('Y-m-d\TH:i'),
            'end' => $m->end_time->format('Y-m-d\TH:i'),
            'meeting_type' => $m->type,
            'status' => $m->status,
            'location' => $m->location,
            'creator' => $m->creator?->name,
            'participants_count' => $m->participants->count(),
            'project' => $m->project?->name,
        ]);

        return $this->successResponse([
            'events' => $tasks->merge($meetings)->sortBy('start')->values(),
        ]);
    }
}
