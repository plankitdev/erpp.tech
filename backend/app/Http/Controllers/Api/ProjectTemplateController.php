<?php

namespace App\Http\Controllers\Api;

use App\Models\ProjectTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class ProjectTemplateController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $templates = ProjectTemplate::orderBy('name')->get();
        return $this->successResponse($templates);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'default_tasks' => 'nullable|array',
            'default_tasks.*.title' => 'required|string|max:255',
            'default_tasks.*.priority' => 'nullable|in:low,medium,high',
            'estimated_budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|in:EGP,USD,SAR',
        ]);

        $template = ProjectTemplate::create([
            'company_id' => Auth::user()->company_id,
            'name' => $request->name,
            'description' => $request->description,
            'default_tasks' => $request->default_tasks,
            'estimated_budget' => $request->estimated_budget,
            'currency' => $request->currency ?? 'EGP',
        ]);

        return $this->successResponse($template, 'تم إنشاء القالب', 201);
    }

    public function update(Request $request, ProjectTemplate $projectTemplate): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'default_tasks' => 'nullable|array',
            'default_tasks.*.title' => 'required|string|max:255',
            'default_tasks.*.priority' => 'nullable|in:low,medium,high',
            'estimated_budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|in:EGP,USD,SAR',
        ]);

        $projectTemplate->update($request->only('name', 'description', 'default_tasks', 'estimated_budget', 'currency'));

        return $this->successResponse($projectTemplate, 'تم تحديث القالب');
    }

    public function destroy(ProjectTemplate $projectTemplate): JsonResponse
    {
        $projectTemplate->delete();
        return $this->successResponse(null, 'تم حذف القالب');
    }

    public function apply(Request $request, ProjectTemplate $projectTemplate): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
        ]);

        $project = \App\Models\Project::findOrFail($request->project_id);

        if ($projectTemplate->estimated_budget) {
            $project->update(['estimated_cost' => $projectTemplate->estimated_budget]);
        }

        if ($projectTemplate->default_tasks) {
            foreach ($projectTemplate->default_tasks as $taskData) {
                \App\Models\Task::create([
                    'company_id' => Auth::user()->company_id,
                    'title' => $taskData['title'],
                    'priority' => $taskData['priority'] ?? 'medium',
                    'status' => 'todo',
                    'project_id' => $project->id,
                    'created_by' => Auth::id(),
                ]);
            }
        }

        return $this->successResponse($project->load('tasks'), 'تم تطبيق القالب على المشروع');
    }
}
