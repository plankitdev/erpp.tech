<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EpicController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Epic::with('creator')->withCount('tasks');

        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $epics = $query->orderBy('sort_order')->orderBy('id')->get();
        $epics->each->append(['completed_tasks_count', 'progress']);

        return $this->successResponse(EpicResource::collection($epics));
    }

    public function show(Epic $epic): JsonResponse
    {
        $epic->loadCount('tasks')->load('creator');
        $epic->append(['completed_tasks_count', 'progress']);

        return $this->successResponse(new EpicResource($epic));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateEpic($request);
        $data['created_by'] = $request->user()->id;

        $epic = Epic::create($data);

        return $this->successResponse(
            new EpicResource($epic->load('creator')),
            'تم إنشاء الملحمة بنجاح',
            201
        );
    }

    public function update(Request $request, Epic $epic): JsonResponse
    {
        $data = $this->validateEpic($request, false);
        $epic->update($data);

        return $this->successResponse(
            new EpicResource($epic->load('creator')),
            'تم تحديث الملحمة'
        );
    }

    public function destroy(Epic $epic): JsonResponse
    {
        // Detach tasks so they survive as project-level (un-epiced) tasks.
        $epic->tasks()->update(['epic_id' => null]);
        $epic->delete();

        return $this->successResponse(null, 'تم حذف الملحمة');
    }

    private function validateEpic(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'project_id'  => ($creating ? 'required' : 'sometimes') . '|exists:projects,id',
            'title'       => ($creating ? 'required' : 'sometimes') . '|string|max:255',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:20',
            'status'      => 'sometimes|in:open,in_progress,done',
            'sort_order'  => 'nullable|integer',
        ]);
    }
}
