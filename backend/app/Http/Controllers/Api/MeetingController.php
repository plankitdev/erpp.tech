<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Meeting::with(['creator', 'participants', 'project']);

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }

        if ($request->user()->role === 'employee') {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)
                  ->orWhereHas('participants', fn($q2) => $q2->where('user_id', $userId));
            });
        }

        $meetings = $query->orderBy('start_time', 'desc')->paginate($this->getPerPage());

        return $this->paginatedResponse($meetings);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'type' => 'required|in:team,sales,client,other',
            'notes' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $participantIds = $data['participant_ids'] ?? [];
        unset($data['participant_ids']);

        $data['created_by'] = $request->user()->id;

        $meeting = Meeting::create($data);

        if (!empty($participantIds)) {
            $meeting->participants()->sync($participantIds);

            // Notify participants
            $startFormatted = $meeting->start_time->format('Y-m-d H:i');
            foreach ($participantIds as $participantId) {
                if ($participantId !== $request->user()->id) {
                    NotificationService::meetingScheduled(
                        $meeting->company_id,
                        $participantId,
                        $meeting->title,
                        $startFormatted
                    );
                }
            }
        }

        return $this->successResponse(
            $meeting->load(['creator', 'participants', 'project']),
            'تم إنشاء الاجتماع',
            201
        );
    }

    public function show(Meeting $meeting): JsonResponse
    {
        return $this->successResponse(
            $meeting->load(['creator', 'participants', 'project'])
        );
    }

    public function update(Request $request, Meeting $meeting): JsonResponse
    {
        // Employees can only update their own meetings
        if ($request->user()->role === 'employee' && $meeting->created_by !== $request->user()->id) {
            return $this->errorResponse('غير مصرح لك بتعديل هذا الاجتماع', 403);
        }

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'type' => 'sometimes|in:team,sales,client,other',
            'status' => 'sometimes|in:scheduled,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $participantIds = $data['participant_ids'] ?? null;
        unset($data['participant_ids']);

        $meeting->update($data);

        if ($participantIds !== null) {
            $meeting->participants()->sync($participantIds);
        }

        return $this->successResponse(
            $meeting->load(['creator', 'participants', 'project']),
            'تم تحديث الاجتماع'
        );
    }

    public function destroy(Request $request, Meeting $meeting): JsonResponse
    {
        // Employees can only delete their own meetings
        if ($request->user()->role === 'employee' && $meeting->created_by !== $request->user()->id) {
            return $this->errorResponse('غير مصرح لك بحذف هذا الاجتماع', 403);
        }

        $meeting->delete();

        return $this->successResponse(null, 'تم حذف الاجتماع');
    }

    public function respond(Request $request, Meeting $meeting): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:accepted,declined',
        ]);

        $meeting->participants()->updateExistingPivot($request->user()->id, [
            'status' => $data['status'],
        ]);

        return $this->successResponse(null, 'تم تحديث الرد');
    }
}
