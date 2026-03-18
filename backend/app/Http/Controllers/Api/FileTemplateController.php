<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileTemplateController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = FileTemplate::with('uploader');

        if ($category = $request->input('category')) {
            $query->where('category', $category);
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:invoice,contract,plan,proposal,report,other',
            'description' => 'nullable|string',
            'file' => 'required|file|max:20480',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        $file = $request->file('file');
        $path = $file->store('file-templates', 'public');

        $template = FileTemplate::create([
            'company_id'  => $request->input('company_id', auth()->user()->company_id),
            'name'        => $request->input('name'),
            'category'    => $request->input('category'),
            'description' => $request->input('description'),
            'file_path'   => $path,
            'file_type'   => $file->getClientMimeType(),
            'file_size'   => $file->getSize(),
            'uploaded_by'  => auth()->id(),
        ]);

        return $this->successResponse($template->load('uploader'), 'تم رفع القالب', 201);
    }

    public function update(Request $request, FileTemplate $fileTemplate): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|in:invoice,contract,plan,proposal,report,other',
            'description' => 'nullable|string',
        ]);

        $fileTemplate->update($request->only(['name', 'category', 'description']));

        return $this->successResponse($fileTemplate->load('uploader'), 'تم التحديث');
    }

    public function destroy(FileTemplate $fileTemplate): JsonResponse
    {
        Storage::disk('public')->delete($fileTemplate->file_path);
        $fileTemplate->delete();

        return $this->successResponse(null, 'تم حذف القالب');
    }
}
