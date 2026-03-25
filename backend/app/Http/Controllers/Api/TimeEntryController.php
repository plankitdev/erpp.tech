<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeEntry;
use App\Models\Task;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeEntryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = TimeEntry::with(['task', 'user', 'project']);

        if ($taskId = $request->input('task_id')) {
            $query->where('task_id', $taskId);
        }
        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($from = $request->input('from')) {
            $query->where('started_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('started_at', '<=', $to . ' 23:59:59');
        }

        if ($request->user()->role === 'employee') {
            $query->where('user_id', $request->user()->id);
        }

        $entries = $query->latest('started_at')->paginate($this->getPerPage());

        return $this->paginatedResponse($entries);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'started_at' => 'required|date',
            'ended_at' => 'nullable|date|after:started_at',
            'duration_minutes' => 'nullable|integer|min:1',
            'description' => 'nullable|string|max:500',
        ]);

        $task = Task::findOrFail($data['task_id']);
        $data['user_id'] = $request->user()->id;
        $data['project_id'] = $task->project_id;

        if (!empty($data['ended_at']) && empty($data['duration_minutes'])) {
            $start = \Carbon\Carbon::parse($data['started_at']);
            $end = \Carbon\Carbon::parse($data['ended_at']);
            $data['duration_minutes'] = $start->diffInMinutes($end);
        }

        $entry = TimeEntry::create($data);

        return $this->successResponse(
            $entry->load(['task', 'user', 'project']),
            'تم تسجيل الوقت',
            201
        );
    }

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'description' => 'nullable|string|max:500',
        ]);

        // Stop any running timer for this user
        $running = TimeEntry::where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->first();

        if ($running) {
            $running->update([
                'ended_at' => now(),
                'duration_minutes' => $running->started_at->diffInMinutes(now()),
            ]);
        }

        $task = Task::findOrFail($data['task_id']);

        $entry = TimeEntry::create([
            'task_id' => $data['task_id'],
            'user_id' => $request->user()->id,
            'project_id' => $task->project_id,
            'started_at' => now(),
            'description' => $data['description'] ?? null,
        ]);

        return $this->successResponse(
            $entry->load(['task', 'user']),
            'تم بدء تتبع الوقت',
            201
        );
    }

    public function stop(Request $request): JsonResponse
    {
        $running = TimeEntry::where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->first();

        if (!$running) {
            return $this->errorResponse('لا يوجد مؤقت قيد التشغيل', 404);
        }

        $running->update([
            'ended_at' => now(),
            'duration_minutes' => $running->started_at->diffInMinutes(now()),
        ]);

        return $this->successResponse(
            $running->load(['task', 'user', 'project']),
            'تم إيقاف تتبع الوقت'
        );
    }

    public function running(Request $request): JsonResponse
    {
        $entry = TimeEntry::with(['task', 'project'])
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->first();

        return $this->successResponse($entry);
    }

    public function summary(Request $request): JsonResponse
    {
        $query = TimeEntry::query();

        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }
        if ($request->user()->role === 'employee') {
            $query->where('user_id', $request->user()->id);
        }

        $from = $request->input('from', now()->startOfWeek()->toDateString());
        $to = $request->input('to', now()->endOfWeek()->toDateString());

        $query->whereBetween('started_at', [$from, $to . ' 23:59:59']);

        $totalMinutes = $query->sum('duration_minutes');

        $byUser = (clone $query)->selectRaw('user_id, SUM(duration_minutes) as total')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get();

        $byProject = (clone $query)->whereNotNull('project_id')
            ->selectRaw('project_id, SUM(duration_minutes) as total')
            ->groupBy('project_id')
            ->with('project:id,name')
            ->get();

        return $this->successResponse([
            'total_minutes' => $totalMinutes,
            'total_hours' => round($totalMinutes / 60, 1),
            'by_user' => $byUser,
            'by_project' => $byProject,
        ]);
    }

    public function destroy(TimeEntry $timeEntry): JsonResponse
    {
        if ($timeEntry->user_id !== auth()->id() && !in_array(auth()->user()->role, ['super_admin', 'manager', 'marketing_manager'])) {
            return $this->errorResponse('غير مصرح لك بحذف هذا السجل', 403);
        }

        $timeEntry->delete();

        return $this->successResponse(null, 'تم حذف سجل الوقت');
    }
}
