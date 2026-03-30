<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Folder;
use App\Models\ManagedFile;
use App\Services\GoogleDriveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileManagerController extends Controller
{
    use ApiResponse;

    /**
     * List folders and files at a given level
     */
    public function index(Request $request): JsonResponse
    {
        $parentId = $request->input('folder_id');

        $folders = Folder::where('parent_id', $parentId)
            ->withCount(['children', 'files'])
            ->with('client:id,name,company_name', 'project:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'type' => $f->type,
                'client' => $f->client,
                'project' => $f->project,
                'children_count' => $f->children_count,
                'files_count' => $f->files_count,
                'created_at' => $f->created_at?->format('Y-m-d H:i'),
            ]);

        $files = ManagedFile::where('folder_id', $parentId)
            ->with('uploader:id,name', 'approver:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'file_path' => $f->file_path,
                'mime_type' => $f->mime_type,
                'file_size' => $f->file_size,
                'status' => $f->status,
                'uploaded_by' => $f->uploader,
                'approved_by' => $f->approver,
                'approved_at' => $f->approved_at?->format('Y-m-d H:i'),
                'notes' => $f->notes,
                'created_at' => $f->created_at?->format('Y-m-d H:i'),
            ]);

        // Build breadcrumbs
        $breadcrumbs = [];
        if ($parentId) {
            $current = Folder::find($parentId);
            while ($current) {
                array_unshift($breadcrumbs, ['id' => $current->id, 'name' => $current->name]);
                $current = $current->parent;
            }
        }

        return $this->successResponse([
            'folders' => $folders,
            'files' => $files,
            'breadcrumbs' => $breadcrumbs,
        ]);
    }

    /**
     * Create a folder
     */
    public function createFolder(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
            'type' => 'nullable|in:client,project,general,custom',
            'client_id' => 'nullable|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $folder = Folder::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'type' => $request->type ?? 'custom',
            'client_id' => $request->client_id,
            'project_id' => $request->project_id,
            'created_by' => auth()->id(),
        ]);

        // Sync to Google Drive in background
        $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
        if ($driveService) {
            $parentDriveId = $driveService->resolveParentDriveFolderId($request->parent_id);
            $driveFolderId = $driveService->createFolder($request->name, $parentDriveId);
            if ($driveFolderId) {
                $folder->update(['drive_folder_id' => $driveFolderId]);
            }
        }

        return $this->successResponse($folder, 'تم إنشاء المجلد', 201);
    }

    /**
     * Rename a folder
     */
    public function renameFolder(Request $request, Folder $folder): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:255']);
        $oldName = $folder->name;
        $folder->update(['name' => $request->name]);

        // Sync rename to Drive
        if ($folder->drive_folder_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            $driveService?->renameFolder($folder->drive_folder_id, $request->name);
        }

        return $this->successResponse($folder, 'تم تعديل الاسم');
    }

    /**
     * Delete a folder and its contents
     */
    public function deleteFolder(Folder $folder): JsonResponse
    {
        // Delete from Drive first
        if ($folder->drive_folder_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            $driveService?->deleteFolder($folder->drive_folder_id);
        }

        // Delete all files recursively (local)
        $this->deleteFilesRecursively($folder);
        $folder->delete();
        return $this->successResponse(null, 'تم حذف المجلد');
    }

    /**
     * Move a folder to another parent
     */
    public function moveFolder(Request $request, Folder $folder): JsonResponse
    {
        $request->validate(['parent_id' => 'nullable|exists:folders,id']);

        // Prevent moving folder into itself or its children
        if ($request->parent_id) {
            $target = Folder::find($request->parent_id);
            $current = $target;
            while ($current) {
                if ($current->id === $folder->id) {
                    return $this->errorResponse('لا يمكن نقل المجلد داخل نفسه', 422);
                }
                $current = $current->parent;
            }
        }

        $folder->update(['parent_id' => $request->parent_id]);

        // Sync move to Drive
        if ($folder->drive_folder_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            if ($driveService) {
                $newParentDriveId = $driveService->resolveParentDriveFolderId($request->parent_id);
                $driveService->moveFolder($folder->drive_folder_id, $newParentDriveId);
            }
        }

        return $this->successResponse($folder, 'تم نقل المجلد');
    }

    /**
     * Upload a file
     */
    public function uploadFile(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50MB
            'folder_id' => 'nullable|exists:folders,id',
            'name' => 'nullable|string|max:255',
        ]);

        $uploaded = $request->file('file');
        $path = $uploaded->store('file-manager', 'public');

        $fileName = $request->name ?: $uploaded->getClientOriginalName();

        $managedFile = ManagedFile::create([
            'folder_id' => $request->folder_id,
            'name' => $fileName,
            'file_path' => $path,
            'mime_type' => $uploaded->getClientMimeType(),
            'file_size' => $uploaded->getSize(),
            'status' => 'draft',
            'uploaded_by' => auth()->id(),
        ]);

        // Auto-upload to Google Drive
        $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
        if ($driveService) {
            $parentDriveId = $driveService->resolveParentDriveFolderId($request->folder_id);
            $driveFileId = $driveService->uploadFile($path, $fileName, $uploaded->getClientMimeType(), $parentDriveId);
            if ($driveFileId) {
                $managedFile->update(['drive_file_id' => $driveFileId]);
            }
        }

        $managedFile->load('uploader:id,name');

        return $this->successResponse([
            'id' => $managedFile->id,
            'name' => $managedFile->name,
            'file_path' => $managedFile->file_path,
            'mime_type' => $managedFile->mime_type,
            'file_size' => $managedFile->file_size,
            'status' => $managedFile->status,
            'uploaded_by' => $managedFile->uploader,
            'created_at' => $managedFile->created_at?->format('Y-m-d H:i'),
        ], 'تم رفع الملف', 201);
    }

    /**
     * Delete a file
     */
    public function deleteFile(ManagedFile $managedFile): JsonResponse
    {
        // Delete from Drive
        if ($managedFile->drive_file_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            $driveService?->deleteFile($managedFile->drive_file_id);
        }

        Storage::disk('public')->delete($managedFile->file_path);
        $managedFile->delete();
        return $this->successResponse(null, 'تم حذف الملف');
    }

    /**
     * Move a file to another folder
     */
    public function moveFile(Request $request, ManagedFile $managedFile): JsonResponse
    {
        $request->validate(['folder_id' => 'nullable|exists:folders,id']);
        $managedFile->update(['folder_id' => $request->folder_id]);

        // Sync move to Drive
        if ($managedFile->drive_file_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            if ($driveService) {
                $newParentDriveId = $driveService->resolveParentDriveFolderId($request->folder_id);
                $driveService->moveFile($managedFile->drive_file_id, $newParentDriveId);
            }
        }

        return $this->successResponse($managedFile, 'تم نقل الملف');
    }

    /**
     * Rename a file
     */
    public function renameFile(Request $request, ManagedFile $managedFile): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:255']);
        $managedFile->update(['name' => $request->name]);

        // Sync rename to Drive
        if ($managedFile->drive_file_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            $driveService?->renameFile($managedFile->drive_file_id, $request->name);
        }

        return $this->successResponse($managedFile, 'تم تعديل الاسم');
    }

    /**
     * Approve a file
     */
    public function approveFile(ManagedFile $managedFile): JsonResponse
    {
        $managedFile->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);
        return $this->successResponse($managedFile, 'تم اعتماد الملف');
    }

    /**
     * Get storage stats
     */
    public function stats(): JsonResponse
    {
        $totalFiles = ManagedFile::count();
        $totalSize = ManagedFile::sum('file_size');
        $totalFolders = Folder::count();
        $byStatus = ManagedFile::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->successResponse([
            'total_files' => $totalFiles,
            'total_size' => $totalSize,
            'total_folders' => $totalFolders,
            'by_status' => $byStatus,
        ]);
    }

    /**
     * Search files and folders
     */
    public function search(Request $request): JsonResponse
    {
        $q = $request->input('q', '');
        if (strlen($q) < 2) {
            return $this->successResponse(['folders' => [], 'files' => []]);
        }

        $folders = Folder::where('name', 'like', "%{$q}%")
            ->with('parent:id,name')
            ->limit(20)
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'type' => 'folder',
                'parent_name' => $f->parent?->name,
            ]);

        $files = ManagedFile::where('name', 'like', "%{$q}%")
            ->with('folder:id,name', 'uploader:id,name')
            ->limit(30)
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'type' => 'file',
                'mime_type' => $f->mime_type,
                'file_path' => $f->file_path,
                'file_size' => $f->file_size,
                'folder_name' => $f->folder?->name,
                'uploaded_by' => $f->uploader,
            ]);

        return $this->successResponse([
            'folders' => $folders,
            'files' => $files,
        ]);
    }

    /**
     * Download a file — serves from local storage or fetches from Drive if deleted locally.
     */
    public function downloadFile(ManagedFile $managedFile)
    {
        $localPath = Storage::disk('public')->path($managedFile->file_path);

        // If file exists locally, serve it
        if (file_exists($localPath)) {
            return response()->download($localPath, $managedFile->name);
        }

        // File deleted locally — try fetching from Drive
        if ($managedFile->drive_file_id) {
            $driveService = GoogleDriveService::forCompany(auth()->user()->company_id);
            if ($driveService) {
                $content = $driveService->downloadFile($managedFile->drive_file_id);
                if ($content) {
                    // Determine MIME type from stored value or file extension
                    $mimeType = $managedFile->mime_type;
                    if (!$mimeType) {
                        $ext = strtolower(pathinfo($managedFile->name, PATHINFO_EXTENSION));
                        $mimeMap = [
                            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                            'ppt'  => 'application/vnd.ms-powerpoint',
                            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'doc'  => 'application/msword',
                            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'xls'  => 'application/vnd.ms-excel',
                            'pdf'  => 'application/pdf',
                        ];
                        $mimeType = $mimeMap[$ext] ?? 'application/octet-stream';
                    }

                    return response($content, 200, [
                        'Content-Type' => $mimeType,
                        'Content-Disposition' => 'attachment; filename="' . $managedFile->name . '"',
                        'Content-Length' => strlen($content),
                    ]);
                }
            }
        }

        return response()->json(['message' => 'الملف غير متوفر'], 404);
    }

    private function deleteFilesRecursively(Folder $folder): void
    {
        foreach ($folder->files as $file) {
            Storage::disk('public')->delete($file->file_path);
        }
        foreach ($folder->children as $child) {
            $this->deleteFilesRecursively($child);
        }
    }
}
