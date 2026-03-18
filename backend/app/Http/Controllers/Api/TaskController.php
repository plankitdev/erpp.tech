<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskCommentResource;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Task::class);

        $query = Task::with(['assignedUser', 'client', 'creator', 'project', 'assignees', 'subtasks']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }
        if ($assignee = $request->input('assigned_to')) {
            $query->where(function ($q) use ($assignee) {
                $q->where('assigned_to', $assignee)
                  ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $assignee));
            });
        }
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }
        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }
        if ($request->input('parent_only')) {
            $query->whereNull('parent_id');
        }
        if ($parentId = $request->input('parent_id')) {
            $query->where('parent_id', $parentId);
        }
        if ($recurrence = $request->input('recurrence')) {
            $query->where('recurrence', $recurrence);
        }

        if ($request->user()->role === 'employee') {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('assigned_to', $userId)
                  ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
            });
        }

        $tasks = $query->latest()->paginate($this->getPerPage());

        return $this->paginatedResponse($tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $assigneeIds = [];
        if (isset($data['assignee_ids'])) {
            $assigneeIds = $data['assignee_ids'];
            unset($data['assignee_ids']);
        }

        $task = Task::create($data);

        // Sync multi-assignees
        if (!empty($assigneeIds)) {
            $task->assignees()->sync($assigneeIds);
        }

        return $this->successResponse(
            new TaskResource($task->load(['assignedUser', 'client', 'project', 'assignees', 'subtasks'])),
            'تم إضافة المهمة بنجاح',
            201
        );
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $task->load([
            'assignedUser', 'client', 'creator', 'project',
            'assignees', 'comments.user',
            'subtasks.assignedUser', 'subtasks.assignees',
            'parent',
        ]);
        return $this->successResponse(new TaskResource($task));
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validated();

        $assigneeIds = null;
        if (isset($data['assignee_ids'])) {
            $assigneeIds = $data['assignee_ids'];
            unset($data['assignee_ids']);
        }

        $task->update($data);

        if ($assigneeIds !== null) {
            $task->assignees()->sync($assigneeIds);
        }

        return $this->successResponse(
            new TaskResource($task->load(['assignedUser', 'client', 'project', 'assignees', 'subtasks'])),
            'تم تحديث المهمة'
        );
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $task->delete();
        return $this->successResponse(null, 'تم حذف المهمة');
    }

    public function addComment(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'comment'    => 'required|string',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $data = [
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'comment' => $request->comment,
        ];

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('task-attachments', 'public');
        }

        $comment = $task->comments()->create($data);
        return $this->successResponse(new TaskCommentResource($comment->load('user')), 'تم إضافة التعليق', 201);
    }
}
