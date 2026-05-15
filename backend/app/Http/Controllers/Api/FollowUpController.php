<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FollowUpResource;
use App\Models\FollowUp;
use App\Services\FollowUpService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowUpController extends Controller
{
    use ApiResponse;

    /**
     * List follow-ups with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = FollowUp::with(['assignedUser', 'creator', 'followable']);

        // Filters
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        } else {
            // Default: show active only
            $query->active();
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }
        if ($assignee = $request->input('assigned_to')) {
            $query->where('assigned_to', $assignee);
        }

        // Employees see only their follow-ups
        if ($request->user()->role === 'employee') {
            $query->where('assigned_to', $request->user()->id);
        }

        if ($request->boolean('overdue_only')) {
            $query->where('due_date', '<', now());
        }

        $followUps = $query->orderByRaw("FIELD(priority, 'critical', 'high', 'medium', 'low')")
            ->orderBy('due_date')
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($followUps);
    }

    /**
     * Get follow-up stats/summary.
     */
    public function summary(Request $request): JsonResponse
    {
        $query = FollowUp::active();

        if ($request->user()->role === 'employee') {
            $query->where('assigned_to', $request->user()->id);
        }

        $stats = [
            'total_active'   => (clone $query)->count(),
            'critical'       => (clone $query)->where('priority', FollowUp::PRIORITY_CRITICAL)->count(),
            'high'           => (clone $query)->where('priority', FollowUp::PRIORITY_HIGH)->count(),
            'overdue'        => (clone $query)->where('due_date', '<', now())->count(),
            'by_type'        => (clone $query)
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
        ];

        return $this->successResponse($stats);
    }

    /**
     * Create a manual follow-up.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'            => 'sometimes|in:' . implode(',', FollowUp::TYPES),
            'followable_type' => 'required|in:Task,Contract,Invoice,Client',
            'followable_id'   => 'required|integer',
            'assigned_to'     => 'nullable|exists:users,id',
            'priority'        => 'sometimes|in:' . implode(',', FollowUp::PRIORITIES),
            'note'            => 'required|string|max:1000',
            'due_date'        => 'required|date|after_or_equal:today',
        ]);

        // Map short class names to full namespace
        $typeMap = [
            'Task'     => \App\Models\Task::class,
            'Contract' => \App\Models\Contract::class,
            'Invoice'  => \App\Models\Invoice::class,
            'Client'   => \App\Models\Client::class,
        ];

        $data['followable_type'] = $typeMap[$data['followable_type']];
        $data['type']            = $data['type'] ?? FollowUp::TYPE_MANUAL;
        $data['status']          = FollowUp::STATUS_PENDING;
        $data['priority']        = $data['priority'] ?? FollowUp::PRIORITY_MEDIUM;
        $data['created_by']      = $request->user()->id;
        $data['auto_generated']  = false;

        $followUp = FollowUp::create($data);

        // Notify assigned user
        if ($followUp->assigned_to && $followUp->assigned_to !== $request->user()->id) {
            \App\Services\NotificationService::notify(
                $followUp->company_id,
                $followUp->assigned_to,
                'follow_up',
                '📋 متابعة جديدة',
                $followUp->note,
                null
            );
        }

        return $this->successResponse(
            new FollowUpResource($followUp->load(['assignedUser', 'creator', 'followable'])),
            'تم إنشاء المتابعة بنجاح',
            201
        );
    }

    /**
     * Update follow-up status or note.
     */
    public function update(Request $request, FollowUp $followUp): JsonResponse
    {
        $data = $request->validate([
            'status'      => 'sometimes|in:' . implode(',', FollowUp::STATUSES),
            'priority'    => 'sometimes|in:' . implode(',', FollowUp::PRIORITIES),
            'note'        => 'sometimes|string|max:1000',
            'assigned_to' => 'sometimes|exists:users,id',
            'due_date'    => 'sometimes|date',
        ]);

        // Auto-set resolved_at when status changes to resolved/dismissed
        if (isset($data['status']) && in_array($data['status'], [FollowUp::STATUS_RESOLVED, FollowUp::STATUS_DISMISSED])) {
            $data['resolved_at'] = now();
        }

        $followUp->update($data);

        return $this->successResponse(
            new FollowUpResource($followUp->load(['assignedUser', 'creator', 'followable'])),
            'تم تحديث المتابعة'
        );
    }

    /**
     * Quick resolve a follow-up.
     */
    public function resolve(Request $request, FollowUp $followUp): JsonResponse
    {
        $request->validate(['note' => 'nullable|string|max:500']);

        $followUp->resolve($request->input('note'));

        return $this->successResponse(
            new FollowUpResource($followUp->fresh()->load(['assignedUser', 'creator', 'followable'])),
            'تم إنهاء المتابعة'
        );
    }

    /**
     * Dismiss a follow-up.
     */
    public function dismiss(Request $request, FollowUp $followUp): JsonResponse
    {
        $request->validate(['note' => 'nullable|string|max:500']);

        $followUp->dismiss($request->input('note'));

        return $this->successResponse(
            new FollowUpResource($followUp->fresh()->load(['assignedUser', 'creator', 'followable'])),
            'تم تجاهل المتابعة'
        );
    }

    /**
     * Delete a follow-up.
     */
    public function destroy(FollowUp $followUp): JsonResponse
    {
        $followUp->delete();
        return $this->successResponse(null, 'تم حذف المتابعة');
    }

    /**
     * Manually trigger follow-up generation (admin only).
     */
    public function generate(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        // First auto-resolve completed ones
        $resolved = FollowUpService::autoResolveCompleted($companyId);

        // Then generate new ones
        $stats = FollowUpService::generateForCompany($companyId);
        $stats['auto_resolved'] = $resolved;

        return $this->successResponse($stats, 'تم تحديث المتابعات');
    }
}
