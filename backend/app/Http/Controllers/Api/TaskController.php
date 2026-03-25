<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskCommentResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\TaskFileResource;
use App\Models\Task;
use App\Models\TaskFile;
use App\Services\NotificationService;
use App\Services\WorkflowService;
use App\Models\WorkflowRule;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        // Send task assignment notifications
        if ($task->assigned_to && $task->assigned_to !== $request->user()->id) {
            NotificationService::taskAssigned($task->company_id, $task->assigned_to, $task->title);
        }
        foreach ($assigneeIds as $assigneeId) {
            if ($assigneeId !== $request->user()->id && $assigneeId !== $task->assigned_to) {
                NotificationService::taskAssigned($task->company_id, $assigneeId, $task->title);
            }
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
            'assignees', 'comments.user', 'files.uploader',
            'subtasks.assignedUser', 'subtasks.assignees',
            'parent',
        ]);
        return $this->successResponse(new TaskResource($task));
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validated();
        $wasCompleted = $task->status === Task::STATUS_DONE;

        $assigneeIds = null;
        if (isset($data['assignee_ids'])) {
            $assigneeIds = $data['assignee_ids'];
            unset($data['assignee_ids']);
        }

        $task->update($data);

        if ($assigneeIds !== null) {
            $task->assignees()->sync($assigneeIds);
        }

        // Notify manager/creator when task is completed
        if (!$wasCompleted && $task->status === Task::STATUS_DONE) {
            if ($task->created_by && $task->created_by !== $request->user()->id) {
                NotificationService::taskCompleted($task->company_id, $task->created_by, $task->title, $request->user()->name);
            }
            WorkflowService::fire(WorkflowRule::TRIGGER_TASK_COMPLETED, $task->company_id, $task);
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

    public function batchDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', Task::class);

        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:tasks,id']);
        Task::whereIn('id', $request->ids)->delete();
        return $this->successResponse(null, 'تم حذف المهام المحددة');
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

    public function uploadFile(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $request->validate([
            'file' => 'required|file|max:20480',
            'name' => 'nullable|string|max:255',
        ]);

        $uploaded = $request->file('file');
        $path = $uploaded->store("tasks/{$task->id}", 'public');

        $file = $task->files()->create([
            'uploaded_by' => $request->user()->id,
            'name'        => $request->input('name', $uploaded->getClientOriginalName()),
            'file_path'   => $path,
            'file_type'   => $uploaded->getClientMimeType(),
            'file_size'   => $uploaded->getSize(),
        ]);

        return $this->successResponse(new TaskFileResource($file->load('uploader')), 'تم رفع الملف بنجاح', 201);
    }

    public function deleteFile(Task $task, TaskFile $file): JsonResponse
    {
        $this->authorize('update', $task);

        if ($file->task_id !== $task->id) {
            return $this->errorResponse('الملف غير موجود', 404);
        }

        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return $this->successResponse(null, 'تم حذف الملف');
    }
}
