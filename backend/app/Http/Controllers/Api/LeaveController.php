<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['user', 'approver']);
        $user = $request->user();

        // Non-managers see only their own requests
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            $query->where('user_id', $user->id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }

        $leaves = $query->latest()->paginate($this->getPerPage());
        return $this->paginatedResponse($leaves);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:' . implode(',', LeaveRequest::TYPES),
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:1000',
        ]);

        $startDate = \Carbon\Carbon::parse($data['start_date']);
        $endDate = \Carbon\Carbon::parse($data['end_date']);
        $data['days'] = $startDate->diffInWeekdays($endDate) + 1;
        $data['user_id'] = $request->user()->id;
        $data['status'] = LeaveRequest::STATUS_PENDING;

        $leave = LeaveRequest::create($data);

        // Notify managers
        NotificationService::notifyRoles(
            ['super_admin', 'manager'],
            'task_assigned',
            "طلب إجازة جديد من {$request->user()->name} ({$data['days']} أيام)",
            ['leave_id' => $leave->id]
        );

        return $this->successResponse(
            $leave->load(['user', 'approver']),
            'تم تقديم طلب الإجازة بنجاح',
            201
        );
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if (!in_array($request->user()->role, ['super_admin', 'manager'])) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $leaveRequest->update([
            'status' => LeaveRequest::STATUS_APPROVED,
            'approved_by' => $request->user()->id,
        ]);

        NotificationService::notify(
            $leaveRequest->user_id,
            'task_completed',
            'تمت الموافقة على طلب إجازتك',
            ['leave_id' => $leaveRequest->id]
        );

        return $this->successResponse($leaveRequest->load(['user', 'approver']), 'تمت الموافقة على الإجازة');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if (!in_array($request->user()->role, ['super_admin', 'manager'])) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $data = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update([
            'status' => LeaveRequest::STATUS_REJECTED,
            'approved_by' => $request->user()->id,
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        NotificationService::notify(
            $leaveRequest->user_id,
            'task_completed',
            'تم رفض طلب إجازتك',
            ['leave_id' => $leaveRequest->id]
        );

        return $this->successResponse($leaveRequest->load(['user', 'approver']), 'تم رفض الإجازة');
    }

    public function destroy(LeaveRequest $leaveRequest, Request $request): JsonResponse
    {
        if ($leaveRequest->user_id !== $request->user()->id && !in_array($request->user()->role, ['super_admin', 'manager'])) {
            return $this->errorResponse('غير مصرح', 403);
        }

        if ($leaveRequest->status !== LeaveRequest::STATUS_PENDING) {
            return $this->errorResponse('لا يمكن حذف طلب تمت معالجته');
        }

        $leaveRequest->delete();
        return $this->successResponse(null, 'تم حذف طلب الإجازة');
    }

    public function balance(Request $request): JsonResponse
    {
        $userId = $request->user_id ?: $request->user()->id;
        $year = $request->year ?: now()->year;

        $approved = LeaveRequest::where('user_id', $userId)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereYear('start_date', $year)
            ->get();

        $byType = [];
        foreach (LeaveRequest::TYPES as $type) {
            $byType[$type] = $approved->where('type', $type)->sum('days');
        }

        return $this->successResponse([
            'year' => $year,
            'total_used' => $approved->sum('days'),
            'by_type' => $byType,
            'annual_balance' => max(0, 21 - ($byType['annual'] ?? 0)),
        ]);
    }
}
