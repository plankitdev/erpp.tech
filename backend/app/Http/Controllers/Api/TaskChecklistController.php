<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskChecklist;
use App\Models\Task;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskChecklistController extends Controller
{
    use ApiResponse;

    public function index(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return $this->successResponse(
            $task->checklists()->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $maxOrder = $task->checklists()->max('sort_order') ?? 0;

        $item = $task->checklists()->create([
            'title' => $data['title'],
            'sort_order' => $maxOrder + 1,
        ]);

        return $this->successResponse($item, 'تم إضافة عنصر القائمة', 201);
    }

    public function update(Request $request, Task $task, TaskChecklist $checklist): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'is_completed' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $checklist->update($data);

        return $this->successResponse($checklist, 'تم تحديث العنصر');
    }

    public function destroy(Task $task, TaskChecklist $checklist): JsonResponse
    {
        $this->authorize('update', $task);

        $checklist->delete();

        return $this->successResponse(null, 'تم حذف العنصر');
    }

    public function reorder(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:task_checklists,id',
            'items.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($data['items'] as $item) {
            TaskChecklist::where('id', $item['id'])
                ->where('task_id', $task->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return $this->successResponse(
            $task->checklists()->orderBy('sort_order')->get(),
            'تم إعادة ترتيب القائمة'
        );
    }
}
