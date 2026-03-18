<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
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
            'type' => 'required|in:team,sales,client,other',
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
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'location' => 'nullable|string|max:255',
            'type' => 'sometimes|in:team,sales,client,other',
            'status' => 'sometimes|in:scheduled,in_progress,completed,cancelled',
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

    public function destroy(Meeting $meeting): JsonResponse
    {
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
