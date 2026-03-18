<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['client', 'project', 'creator', 'assignee'])
            ->withCount('replies');

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->priority) {
            $query->where('priority', $request->priority);
        }
        if ($request->category) {
            $query->where('category', $request->category);
        }
        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'LIKE', "%{$search}%")
                  ->orWhere('subject', 'LIKE', "%{$search}%");
            });
        }

        // Non-admin users only see tickets they created or are assigned to
        $user = $request->user();
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id);
            });
        }

        $tickets = $query->latest()->paginate($this->getPerPage());
        return $this->paginatedResponse($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'assigned_to' => 'nullable|exists:users,id',
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'sometimes|in:' . implode(',', Ticket::PRIORITIES),
            'category' => 'sometimes|in:' . implode(',', Ticket::CATEGORIES),
        ]);

        $data['reference'] = Ticket::generateReference($request->user()->company_id);
        $data['created_by'] = $request->user()->id;
        $data['status'] = Ticket::STATUS_OPEN;

        $ticket = Ticket::create($data);

        if ($ticket->assigned_to) {
            NotificationService::notify(
                $ticket->assigned_to,
                'task_assigned',
                "تم تعيين تذكرة لك: {$ticket->subject}",
                ['ticket_id' => $ticket->id, 'reference' => $ticket->reference]
            );
        }

        return $this->successResponse(
            new TicketResource($ticket->load(['client', 'project', 'creator', 'assignee'])),
            'تم إنشاء التذكرة بنجاح',
            201
        );
    }

    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load(['client', 'project', 'creator', 'assignee', 'replies.user']);
        return $this->successResponse(new TicketResource($ticket));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'assigned_to' => 'nullable|exists:users,id',
            'subject' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'priority' => 'sometimes|in:' . implode(',', Ticket::PRIORITIES),
            'status' => 'sometimes|in:' . implode(',', Ticket::STATUSES),
            'category' => 'sometimes|in:' . implode(',', Ticket::CATEGORIES),
        ]);

        // Track status changes
        $oldStatus = $ticket->status;

        if (isset($data['status'])) {
            if ($data['status'] === Ticket::STATUS_RESOLVED && $oldStatus !== Ticket::STATUS_RESOLVED) {
                $data['resolved_at'] = now();
            }
            if ($data['status'] === Ticket::STATUS_CLOSED && $oldStatus !== Ticket::STATUS_CLOSED) {
                $data['closed_at'] = now();
            }
        }

        // Notify if assigned to someone new
        if (isset($data['assigned_to']) && $data['assigned_to'] != $ticket->assigned_to) {
            NotificationService::notify(
                $data['assigned_to'],
                'task_assigned',
                "تم تعيين تذكرة لك: {$ticket->subject}",
                ['ticket_id' => $ticket->id, 'reference' => $ticket->reference]
            );
        }

        $ticket->update($data);

        return $this->successResponse(
            new TicketResource($ticket->load(['client', 'project', 'creator', 'assignee'])),
            'تم تحديث التذكرة'
        );
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();
        return $this->successResponse(null, 'تم حذف التذكرة');
    }

    public function reply(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'body' => 'required|string',
            'is_internal' => 'sometimes|boolean',
        ]);

        $reply = $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'body' => $data['body'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        // Auto-update status to in_progress on first reply if still open
        if ($ticket->status === Ticket::STATUS_OPEN) {
            $ticket->update(['status' => Ticket::STATUS_IN_PROGRESS]);
        }

        // Notify ticket creator about reply (unless they're the replier)
        if ($reply->user_id !== $ticket->created_by && !$reply->is_internal) {
            NotificationService::notify(
                $ticket->created_by,
                'task_completed',
                "رد جديد على التذكرة: {$ticket->subject}",
                ['ticket_id' => $ticket->id, 'reference' => $ticket->reference]
            );
        }

        $reply->load('user');

        return $this->successResponse([
            'id' => $reply->id,
            'body' => $reply->body,
            'is_internal' => $reply->is_internal,
            'user' => ['id' => $reply->user->id, 'name' => $reply->user->name],
            'created_at' => $reply->created_at->toISOString(),
        ], 'تم إضافة الرد');
    }
}
