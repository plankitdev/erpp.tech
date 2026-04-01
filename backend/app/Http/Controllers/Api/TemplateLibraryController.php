<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\UserDocument;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateLibraryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Template::with(['category', 'creator']);

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $templates = $query->latest()->paginate($this->getPerPage(20));

        return $this->paginatedResponse($templates);
    }

    public function show(Template $template): JsonResponse
    {
        return $this->successResponse($template->load(['category', 'creator']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'category_id'     => 'required|exists:template_categories,id',
            'schema'          => 'required|array',
            'schema.fields'   => 'required|array|min:1',
            'preview_data'    => 'nullable|array',
            'thumbnail_color' => 'nullable|string|max:20',
            'is_locked'       => 'nullable|boolean',
        ]);

        $data['created_by'] = auth()->id();

        $template = Template::create($data);

        return $this->successResponse($template->load(['category', 'creator']), 'تم إنشاء التيمبليت', 201);
    }

    public function update(Request $request, Template $template): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'description'     => 'nullable|string',
            'category_id'     => 'sometimes|exists:template_categories,id',
            'schema'          => 'sometimes|array',
            'schema.fields'   => 'sometimes|array|min:1',
            'preview_data'    => 'nullable|array',
            'thumbnail_color' => 'nullable|string|max:20',
            'is_locked'       => 'nullable|boolean',
        ]);

        $template->update($data);

        return $this->successResponse($template->load(['category', 'creator']), 'تم تحديث التيمبليت');
    }

    public function destroy(Template $template): JsonResponse
    {
        $template->delete();
        return $this->successResponse(null, 'تم حذف التيمبليت');
    }

    /**
     * Copy-on-Use: create a user document from a template.
     */
    public function useTemplate(Template $template): JsonResponse
    {
        $schemaSnapshot = $template->schema;

        // Build default data from schema fields
        $defaultData = [];
        foreach ($schemaSnapshot['fields'] ?? [] as $field) {
            $defaultData[$field['key']] = $field['default'] ?? null;
        }

        $document = UserDocument::create([
            'company_id'      => auth()->user()->company_id,
            'user_id'         => auth()->id(),
            'template_id'     => $template->id,
            'title'           => $template->name,
            'schema_snapshot' => $schemaSnapshot,
            'data'            => $defaultData,
            'status'          => 'draft',
        ]);

        $template->increment('usage_count');

        return $this->successResponse(
            $document->load(['user', 'template.category']),
            'تم إنشاء مستند جديد من التيمبليت',
            201
        );
    }

    /**
     * Duplicate a template (admin/manager).
     */
    public function duplicate(Template $template): JsonResponse
    {
        $newTemplate = $template->replicate(['usage_count']);
        $newTemplate->name = $template->name . ' (نسخة)';
        $newTemplate->usage_count = 0;
        $newTemplate->is_default = false;
        $newTemplate->created_by = auth()->id();
        $newTemplate->save();

        return $this->successResponse(
            $newTemplate->load(['category', 'creator']),
            'تم نسخ التيمبليت',
            201
        );
    }
}
