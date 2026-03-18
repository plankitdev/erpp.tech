<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectFile;
use App\Models\EmployeeFile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaLibraryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $type = $request->input('type'); // image, document, pdf, all
        $source = $request->input('source'); // project, employee, task, all
        $projectId = $request->input('project_id');

        $files = collect();

        // Project files
        if (!$source || $source === 'project' || $source === 'all') {
            $query = ProjectFile::with('project:id,name');
            if ($projectId) {
                $query->where('project_id', $projectId);
            }
            $projectFiles = $query->get()->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->original_name ?? $f->name,
                'path' => $f->file_path,
                'mime_type' => $f->mime_type,
                'size' => $f->file_size,
                'source' => 'project',
                'source_name' => $f->project?->name,
                'source_id' => $f->project_id,
                'uploaded_by' => $f->uploaded_by,
                'created_at' => $f->created_at,
            ]);
            $files = $files->merge($projectFiles);
        }

        // Employee files
        if (!$source || $source === 'employee' || $source === 'all') {
            $employeeFiles = EmployeeFile::with('employee:id,name')->get()->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->original_name ?? $f->file_name,
                'path' => $f->file_path,
                'mime_type' => $f->file_type ?? null,
                'size' => null,
                'source' => 'employee',
                'source_name' => $f->employee?->name,
                'source_id' => $f->employee_id,
                'uploaded_by' => $f->uploaded_by,
                'created_at' => $f->created_at,
            ]);
            $files = $files->merge($employeeFiles);
        }

        // Filter by type
        if ($type && $type !== 'all') {
            $files = $files->filter(function ($f) use ($type) {
                $mime = $f['mime_type'] ?? '';
                return match ($type) {
                    'image' => str_starts_with($mime, 'image/'),
                    'pdf' => $mime === 'application/pdf',
                    'document' => in_array($mime, [
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    ]),
                    default => true,
                };
            });
        }

        $sorted = $files->sortByDesc('created_at')->values();

        return $this->successResponse($sorted);
    }
}
