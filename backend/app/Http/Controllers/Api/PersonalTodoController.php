<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalTodo;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalTodoController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $todos = PersonalTodo::where('user_id', auth()->id())
            ->orderBy('is_completed')
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get();

        return $this->successResponse($todos);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:500',
            'due_date' => 'nullable|date',
        ]);

        $maxOrder = PersonalTodo::where('user_id', auth()->id())
            ->where('is_completed', false)
            ->max('sort_order') ?? 0;

        $todo = PersonalTodo::create([
            'user_id' => auth()->id(),
            'title' => $request->title,
            'due_date' => $request->due_date,
            'sort_order' => $maxOrder + 1,
        ]);

        return $this->successResponse($todo, 'تم إضافة المهمة', 201);
    }

    public function update(Request $request, PersonalTodo $personalTodo): JsonResponse
    {
        if ($personalTodo->user_id !== auth()->id()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:500',
            'is_completed' => 'sometimes|boolean',
            'due_date' => 'nullable|date',
        ]);

        $personalTodo->update($request->only(['title', 'is_completed', 'due_date']));

        return $this->successResponse($personalTodo, 'تم التحديث');
    }

    public function destroy(PersonalTodo $personalTodo): JsonResponse
    {
        if ($personalTodo->user_id !== auth()->id()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $personalTodo->delete();

        return $this->successResponse(null, 'تم الحذف');
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:personal_todos,id',
        ]);

        foreach ($request->ids as $index => $id) {
            PersonalTodo::where('id', $id)
                ->where('user_id', auth()->id())
                ->update(['sort_order' => $index]);
        }

        return $this->successResponse(null, 'تم إعادة الترتيب');
    }
}
