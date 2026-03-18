<?php

namespace App\Http\Controllers\Api;

use App\Models\Tag;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class TagController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $tags = Tag::withCount(['clients', 'tasks', 'projects', 'leads'])->orderBy('name')->get();
        return $this->successResponse($tags);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'nullable|string|max:7|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        $tag = Tag::create([
            'company_id' => Auth::user()->company_id,
            'name' => $request->name,
            'color' => $request->color ?? '#3b82f6',
        ]);

        return $this->successResponse($tag, 'تم إنشاء العلامة', 201);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'nullable|string|max:7|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        $tag->update($request->only('name', 'color'));
        return $this->successResponse($tag, 'تم تحديث العلامة');
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();
        return $this->successResponse(null, 'تم حذف العلامة');
    }

    public function attach(Request $request): JsonResponse
    {
        $request->validate([
            'tag_id' => 'required|integer|exists:tags,id',
            'taggable_type' => 'required|in:client,task,project,lead',
            'taggable_id' => 'required|integer',
        ]);

        $modelMap = [
            'client' => \App\Models\Client::class,
            'task' => \App\Models\Task::class,
            'project' => \App\Models\Project::class,
            'lead' => \App\Models\Lead::class,
        ];

        $model = $modelMap[$request->taggable_type]::findOrFail($request->taggable_id);
        $model->tags()->syncWithoutDetaching([$request->tag_id]);

        return $this->successResponse(null, 'تم إضافة العلامة');
    }

    public function detach(Request $request): JsonResponse
    {
        $request->validate([
            'tag_id' => 'required|integer|exists:tags,id',
            'taggable_type' => 'required|in:client,task,project,lead',
            'taggable_id' => 'required|integer',
        ]);

        $modelMap = [
            'client' => \App\Models\Client::class,
            'task' => \App\Models\Task::class,
            'project' => \App\Models\Project::class,
            'lead' => \App\Models\Lead::class,
        ];

        $model = $modelMap[$request->taggable_type]::findOrFail($request->taggable_id);
        $model->tags()->detach($request->tag_id);

        return $this->successResponse(null, 'تم إزالة العلامة');
    }
}
