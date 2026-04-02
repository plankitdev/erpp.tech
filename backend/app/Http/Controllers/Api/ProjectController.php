<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectFileResource;
use App\Http\Resources\TaskResource;
use App\Models\ChatChannel;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);
        $query = Project::with(['client', 'creator'])
            ->withCount(['tasks', 'files']);

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($clientId = $request->input('client_id')) {
            $query->where('client_id', $clientId);
        }

        $projects = $query->latest()->paginate($this->getPerPage());

        // Append progress for each project
        $projects->getCollection()->each(function ($project) {
            $project->append(['progress', 'completed_tasks_count']);
        });

        return $this->paginatedResponse($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'client_id'   => 'nullable|exists:clients,id',
            'status'      => 'sometimes|in:active,completed,on_hold,cancelled',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'budget'      => 'nullable|numeric|min:0',
            'currency'    => 'sometimes|in:EGP,USD,SAR',
        ]);

        $data['created_by'] = $request->user()->id;
        $project = Project::create($data);

        // Auto-create chat channel for the project
        $channelName = $project->name;
        if ($project->client_id) {
            $client = \App\Models\Client::find($project->client_id);
            if ($client) {
                $channelName = $client->name;
            }
        }
        $channel = ChatChannel::create([
            'company_id'  => $project->company_id,
            'name'        => $channelName,
            'type'        => ChatChannel::TYPE_PUBLIC,
            'description' => "قناة مشروع: {$project->name}",
            'created_by'  => $request->user()->id,
        ]);
        $companyUserIds = User::where('company_id', $project->company_id)->pluck('id');
        $channel->members()->attach($companyUserIds);

        NotificationService::projectCreated($project->company_id, $project->name, "/projects/{$project->slug}");

        return $this->successResponse(
            new ProjectResource($project->load(['client', 'creator'])),
            'تم إنشاء المشروع بنجاح',
            201
        );
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $project->load([
            'client',
            'creator',
            'tasks' => fn($q) => $q->whereNull('parent_id')->with(['assignedUser', 'assignees', 'subtasks.assignedUser']),
            'files.uploader',
        ]);
        $project->loadCount(['tasks', 'files']);
        $project->append(['progress', 'completed_tasks_count']);

        return $this->successResponse(new ProjectResource($project));
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'client_id'   => 'nullable|exists:clients,id',
            'status'      => 'sometimes|in:active,completed,on_hold,cancelled',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
            'budget'      => 'nullable|numeric|min:0',
            'currency'    => 'sometimes|in:EGP,USD,SAR',
        ]);

        $project->update($data);

        return $this->successResponse(
            new ProjectResource($project->load(['client', 'creator'])),
            'تم تحديث المشروع'
        );
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        $project->delete();
        return $this->successResponse(null, 'تم حذف المشروع');
    }

    // ========== Project Files ==========

    public function uploadFile(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $request->validate([
            'file' => 'required|file|max:20480',
            'name' => 'nullable|string|max:255',
            'parent_id' => 'nullable|integer|exists:project_files,id',
        ]);

        $uploaded = $request->file('file');
        $path = $uploaded->store("projects/{$project->id}", 'public');

        $file = $project->files()->create([
            'uploaded_by' => $request->user()->id,
            'name'        => $request->input('name', $uploaded->getClientOriginalName()),
            'file_path'   => $path,
            'file_type'   => $uploaded->getClientMimeType(),
            'file_size'   => $uploaded->getSize(),
            'parent_id'   => $request->input('parent_id'),
        ]);

        return $this->successResponse(
            new ProjectFileResource($file->load('uploader')),
            'تم رفع الملف بنجاح',
            201
        );
    }

    public function createFolder(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:project_files,id',
        ]);

        $folder = $project->files()->create([
            'uploaded_by' => $request->user()->id,
            'name'        => $request->input('name'),
            'file_path'   => '',
            'file_type'   => 'folder',
            'file_size'   => 0,
            'parent_id'   => $request->input('parent_id'),
        ]);

        return $this->successResponse(
            new ProjectFileResource($folder->load('uploader')),
            'تم إنشاء المجلد بنجاح',
            201
        );
    }

    public function deleteFile(Project $project, ProjectFile $file): JsonResponse
    {
        $this->authorize('update', $project);
        if ($file->project_id !== $project->id) {
            return $this->errorResponse('الملف غير موجود', 404);
        }

        Storage::disk('public')->delete($file->file_path);
        $file->delete();
        return $this->successResponse(null, 'تم حذف الملف');
    }

    // ========== Client Profile within Project ==========

    public function clientProfile(Project $project): JsonResponse
    {
        $project->load(['client']);

        if (!$project->client) {
            return $this->errorResponse('لا يوجد عميل مرتبط بهذا المشروع', 404);
        }

        $client = $project->client;
        $client->load(['contracts.invoices.payments', 'tasks' => fn($q) => $q->where('project_id', $project->id)]);

        $tasks = $project->tasks()->where('client_id', $client->id)->with('assignedUser')->get();
        $invoices = $client->invoices;
        $files = $project->files;

        return $this->successResponse([
            'client'   => $client,
            'tasks'    => TaskResource::collection($tasks),
            'invoices' => $invoices,
            'files'    => ProjectFileResource::collection($files),
            'payments' => $invoices->flatMap->payments,
        ]);
    }

    // ========== Employee Reports ==========

    public function employeeReport(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year'  => 'required|integer|min:2020',
        ]);

        $month = $request->input('month');
        $year  = $request->input('year');

        $companyId = $request->user()->company_id;

        // Get all employees with tasks in this period
        $employees = \App\Models\Employee::where('company_id', $companyId)
            ->with(['user'])
            ->get()
            ->map(function ($employee) use ($month, $year) {
                $userId = $employee->user_id;
                if (!$userId) return null;

                $tasksQuery = \App\Models\Task::where('company_id', $employee->company_id)
                    ->where(function ($q) use ($userId) {
                        $q->where('assigned_to', $userId)
                          ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
                    })
                    ->whereMonth('updated_at', $month)
                    ->whereYear('updated_at', $year);

                $totalTasks = (clone $tasksQuery)->count();
                $completedTasks = (clone $tasksQuery)->where('status', 'done')->count();
                $inProgressTasks = (clone $tasksQuery)->where('status', 'in_progress')->count();
                $overdueTasks = (clone $tasksQuery)->where('status', '!=', 'done')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now())
                    ->count();

                return [
                    'employee_id'     => $employee->id,
                    'name'            => $employee->name,
                    'position'        => $employee->position,
                    'total_tasks'     => $totalTasks,
                    'completed_tasks' => $completedTasks,
                    'in_progress_tasks' => $inProgressTasks,
                    'overdue_tasks'   => $overdueTasks,
                    'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
                ];
            })
            ->filter()
            ->values();

        return $this->successResponse([
            'month'     => $month,
            'year'      => $year,
            'employees' => $employees,
            'summary'   => [
                'total_employees'    => $employees->count(),
                'total_tasks'        => $employees->sum('total_tasks'),
                'total_completed'    => $employees->sum('completed_tasks'),
                'total_overdue'      => $employees->sum('overdue_tasks'),
                'avg_completion_rate' => $employees->count() > 0 ? round($employees->avg('completion_rate')) : 0,
            ],
        ]);
    }
}
