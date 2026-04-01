<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Folder;
use App\Models\ManagedFile;
use App\Models\UserDocument;
use App\Services\GoogleDriveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserDocumentController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = UserDocument::with(['user', 'template.category', 'project', 'client'])
            ->where('user_id', auth()->id());

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $documents = $query->latest()->paginate($this->getPerPage(20));

        return $this->paginatedResponse($documents);
    }

    public function show(UserDocument $document): JsonResponse
    {
        if ($document->user_id !== auth()->id() && !auth()->user()->isSuperAdmin() && !auth()->user()->isManager()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        return $this->successResponse(
            $document->load(['user', 'template.category', 'project', 'client', 'managedFile'])
        );
    }

    public function update(Request $request, UserDocument $document): JsonResponse
    {
        if ($document->user_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $data = $request->validate([
            'title'      => 'sometimes|string|max:255',
            'data'       => 'sometimes|array',
            'project_id' => 'nullable|exists:projects,id',
            'client_id'  => 'nullable|exists:clients,id',
        ]);

        $document->update($data);

        return $this->successResponse($document->load(['user', 'template.category']), 'تم تحديث المستند');
    }

    public function updateStatus(Request $request, UserDocument $document): JsonResponse
    {
        if ($document->user_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $data = $request->validate([
            'status' => 'required|in:draft,completed,archived',
        ]);

        $document->update($data);

        return $this->successResponse($document, 'تم تحديث الحالة');
    }

    /**
     * Save the document as a file in File Manager + sync to Google Drive.
     */
    public function saveToFileManager(UserDocument $document): JsonResponse
    {
        if ($document->user_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        // 1. Find or create "مستندات التيمبليتس" folder
        $folder = Folder::firstOrCreate(
            [
                'company_id' => $document->company_id,
                'name'       => 'مستندات التيمبليتس',
                'parent_id'  => null,
            ],
            [
                'type'       => 'general',
                'created_by' => auth()->id(),
            ]
        );

        // 2. Generate JSON file
        $fileName = $document->title . ' — ' . now()->format('Y-m-d H-i') . '.json';
        $filePath = 'documents/' . $document->company_id . '/' . $fileName;
        Storage::disk('public')->put($filePath, json_encode($document->data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        // 3. Create ManagedFile record
        $managedFile = ManagedFile::create([
            'company_id'  => $document->company_id,
            'folder_id'   => $folder->id,
            'name'        => $fileName,
            'file_path'   => $filePath,
            'mime_type'   => 'application/json',
            'file_size'   => Storage::disk('public')->size($filePath),
            'status'      => 'approved',
            'uploaded_by' => $document->user_id,
        ]);

        // 4. Sync to Google Drive
        $driveService = GoogleDriveService::forCompany($document->company_id);
        if ($driveService) {
            $driveFolderId = $driveService->resolveParentDriveFolderId($folder->id);
            $driveFileId = $driveService->uploadFile($filePath, $fileName, 'application/json', $driveFolderId);
            if ($driveFileId) {
                $managedFile->update(['drive_file_id' => $driveFileId]);
            }
        }

        // 5. Link document to file
        $document->update([
            'folder_id'       => $folder->id,
            'managed_file_id' => $managedFile->id,
            'status'          => 'completed',
        ]);

        return $this->successResponse(
            $document->load(['managedFile', 'folder']),
            'تم حفظ المستند في مدير الملفات'
        );
    }

    public function destroy(UserDocument $document): JsonResponse
    {
        if ($document->user_id !== auth()->id() && !auth()->user()->isSuperAdmin()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $document->delete();

        return $this->successResponse(null, 'تم حذف المستند');
    }
}
