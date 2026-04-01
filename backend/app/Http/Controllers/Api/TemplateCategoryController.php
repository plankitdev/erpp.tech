<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemplateCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TemplateCategoryController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $categories = TemplateCategory::withCount('templates')
            ->orderBy('sort_order')
            ->get();

        return $this->successResponse($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'color'      => 'nullable|string|max:20',
            'icon'       => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $category = TemplateCategory::create($data);

        return $this->successResponse($category, 'تم إنشاء القسم', 201);
    }

    public function update(Request $request, TemplateCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'color'      => 'nullable|string|max:20',
            'icon'       => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return $this->successResponse($category, 'تم تحديث القسم');
    }

    public function destroy(TemplateCategory $category): JsonResponse
    {
        $category->delete();
        return $this->successResponse(null, 'تم حذف القسم');
    }
}
