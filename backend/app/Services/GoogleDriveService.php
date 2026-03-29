<?php

namespace App\Services;

use App\Models\GoogleDriveToken;
use App\Models\Folder;
use App\Models\ManagedFile;
use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GoogleDriveService
{
    /**
     * Get an authenticated Google Drive service for a company.
     * Returns null if Drive is not connected or token refresh fails.
     */
    public static function forCompany(int $companyId): ?self
    {
        $driveToken = GoogleDriveToken::where('company_id', $companyId)->first();
        if (!$driveToken) {
            return null;
        }

        try {
            $instance = new self();
            $instance->driveToken = $driveToken;
            $instance->companyId = $companyId;
            $instance->initClient();
            return $instance;
        } catch (\Exception $e) {
            Log::warning('GoogleDriveService: failed to init for company ' . $companyId, ['error' => $e->getMessage()]);
            return null;
        }
    }

    private GoogleDriveToken $driveToken;
    private int $companyId;
    private GoogleDrive $drive;

    private function initClient(): void
    {
        $client = new GoogleClient();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessType('offline');
        $client->setAccessToken($this->driveToken->access_token);

        // Refresh if expired
        if ($this->driveToken->expires_at && $this->driveToken->expires_at->isPast()) {
            if (!$this->driveToken->refresh_token) {
                throw new \RuntimeException('No refresh token available');
            }
            $client->fetchAccessTokenWithRefreshToken($this->driveToken->refresh_token);
            $newToken = $client->getAccessToken();
            $this->driveToken->update([
                'access_token' => $newToken['access_token'],
                'expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
            ]);
        }

        $this->drive = new GoogleDrive($client);
    }

    /**
     * Get the root sync folder ID in Drive.
     */
    public function getRootFolderId(): ?string
    {
        return $this->driveToken->drive_folder_id;
    }

    // ─── Folder Operations ─────────────────────────────────

    /**
     * Create a folder in Drive. Returns the Drive folder ID.
     */
    public function createFolder(string $name, ?string $parentDriveFolderId = null): ?string
    {
        try {
            $parentId = $parentDriveFolderId ?: $this->getRootFolderId();

            $driveFolder = new DriveFile([
                'name' => $name,
                'mimeType' => 'application/vnd.google-apps.folder',
                'parents' => [$parentId],
            ]);

            $created = $this->drive->files->create($driveFolder, ['fields' => 'id']);
            return $created->id;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: createFolder failed', ['name' => $name, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Rename a folder in Drive.
     */
    public function renameFolder(string $driveFolderId, string $newName): bool
    {
        try {
            $this->drive->files->update($driveFolderId, new DriveFile(['name' => $newName]));
            return true;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: renameFolder failed', ['id' => $driveFolderId, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Delete a folder (and its contents) from Drive.
     */
    public function deleteFolder(string $driveFolderId): bool
    {
        try {
            $this->drive->files->delete($driveFolderId);
            return true;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: deleteFolder failed', ['id' => $driveFolderId, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Move a folder to a new parent in Drive.
     */
    public function moveFolder(string $driveFolderId, ?string $newParentDriveFolderId): bool
    {
        try {
            $newParent = $newParentDriveFolderId ?: $this->getRootFolderId();

            // Get current parents
            $file = $this->drive->files->get($driveFolderId, ['fields' => 'parents']);
            $previousParents = implode(',', $file->parents ?? []);

            $this->drive->files->update($driveFolderId, new DriveFile(), [
                'addParents' => $newParent,
                'removeParents' => $previousParents,
                'fields' => 'id, parents',
            ]);
            return true;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: moveFolder failed', ['id' => $driveFolderId, 'error' => $e->getMessage()]);
            return false;
        }
    }

    // ─── File Operations ───────────────────────────────────

    /**
     * Upload a file to Drive. Returns the Drive file ID.
     */
    public function uploadFile(string $localPath, string $name, string $mimeType, ?string $parentDriveFolderId = null): ?string
    {
        try {
            $parentId = $parentDriveFolderId ?: $this->getRootFolderId();
            $fullPath = Storage::disk('public')->path($localPath);

            if (!file_exists($fullPath)) {
                return null;
            }

            $driveFile = new DriveFile([
                'name' => $name,
                'parents' => [$parentId],
            ]);

            $content = file_get_contents($fullPath);

            $created = $this->drive->files->create($driveFile, [
                'data' => $content,
                'mimeType' => $mimeType,
                'uploadType' => 'multipart',
                'fields' => 'id',
            ]);

            return $created->id;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: uploadFile failed', ['name' => $name, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Download a file from Drive. Returns the file content as string or null.
     */
    public function downloadFile(string $driveFileId): ?string
    {
        try {
            $response = $this->drive->files->get($driveFileId, ['alt' => 'media']);
            return $response->getBody()->getContents();
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: downloadFile failed', ['id' => $driveFileId, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Delete a file from Drive.
     */
    public function deleteFile(string $driveFileId): bool
    {
        try {
            $this->drive->files->delete($driveFileId);
            return true;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: deleteFile failed', ['id' => $driveFileId, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Rename a file in Drive.
     */
    public function renameFile(string $driveFileId, string $newName): bool
    {
        try {
            $this->drive->files->update($driveFileId, new DriveFile(['name' => $newName]));
            return true;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: renameFile failed', ['id' => $driveFileId, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Move a file to a new folder in Drive.
     */
    public function moveFile(string $driveFileId, ?string $newParentDriveFolderId): bool
    {
        try {
            $newParent = $newParentDriveFolderId ?: $this->getRootFolderId();

            $file = $this->drive->files->get($driveFileId, ['fields' => 'parents']);
            $previousParents = implode(',', $file->parents ?? []);

            $this->drive->files->update($driveFileId, new DriveFile(), [
                'addParents' => $newParent,
                'removeParents' => $previousParents,
                'fields' => 'id, parents',
            ]);
            return true;
        } catch (\Exception $e) {
            Log::warning('GoogleDrive: moveFile failed', ['id' => $driveFileId, 'error' => $e->getMessage()]);
            return false;
        }
    }

    // ─── Bulk Sync (existing manual sync, improved) ────────

    /**
     * Sync all files and folders for a company.
     * Stores drive IDs in local DB for future operations.
     */
    public function syncAll(): array
    {
        $rootFolderId = $this->getRootFolderId();
        $folders = Folder::where('company_id', $this->companyId)->get();
        $files = ManagedFile::where('company_id', $this->companyId)->get();

        $syncedFiles = 0;
        $errors = 0;

        // Build folder tree and sync
        $folderMap = []; // local_id => drive_id
        foreach ($this->buildFolderTree($folders) as $folder) {
            try {
                if ($folder->drive_folder_id) {
                    // Already synced, just record in map
                    $folderMap[$folder->id] = $folder->drive_folder_id;
                    continue;
                }

                $parentId = ($folder->parent_id && isset($folderMap[$folder->parent_id]))
                    ? $folderMap[$folder->parent_id]
                    : $rootFolderId;

                // Check if folder already exists in Drive
                $existing = $this->drive->files->listFiles([
                    'q' => "name='" . addcslashes($folder->name, "'") . "' and '{$parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
                    'fields' => 'files(id)',
                    'pageSize' => 1,
                ]);

                if (count($existing->files) > 0) {
                    $driveFolderId = $existing->files[0]->id;
                } else {
                    $driveFolderId = $this->createFolder($folder->name, $parentId);
                }

                if ($driveFolderId) {
                    Folder::where('id', $folder->id)->update(['drive_folder_id' => $driveFolderId]);
                    $folderMap[$folder->id] = $driveFolderId;
                }
            } catch (\Exception $e) {
                $errors++;
            }
        }

        // Sync files
        foreach ($files as $file) {
            try {
                if ($file->drive_file_id) {
                    $syncedFiles++;
                    continue; // Already synced
                }

                $parentId = ($file->folder_id && isset($folderMap[$file->folder_id]))
                    ? $folderMap[$file->folder_id]
                    : $rootFolderId;

                $driveFileId = $this->uploadFile($file->file_path, $file->name, $file->mime_type ?? 'application/octet-stream', $parentId);

                if ($driveFileId) {
                    $file->update(['drive_file_id' => $driveFileId]);
                    $syncedFiles++;
                } else {
                    $errors++;
                }
            } catch (\Exception $e) {
                $errors++;
            }
        }

        $this->driveToken->update(['last_synced_at' => now()]);

        return [
            'synced_files' => $syncedFiles,
            'errors' => $errors,
            'total_files' => $files->count(),
            'total_folders' => $folders->count(),
        ];
    }

    private function buildFolderTree($folders): array
    {
        $result = [];
        $remaining = $folders->all();
        $processed = [];

        // Root folders first
        foreach ($remaining as $key => $folder) {
            if (empty($folder->parent_id)) {
                $result[] = $folder;
                $processed[] = $folder->id;
                unset($remaining[$key]);
            }
        }

        // Children of processed
        $maxPasses = 20;
        while (count($remaining) > 0 && $maxPasses-- > 0) {
            foreach ($remaining as $key => $folder) {
                if (in_array($folder->parent_id, $processed)) {
                    $result[] = $folder;
                    $processed[] = $folder->id;
                    unset($remaining[$key]);
                }
            }
        }

        return $result;
    }

    /**
     * Resolve the parent Drive folder ID for a local folder.
     */
    public function resolveParentDriveFolderId(?int $parentFolderId): ?string
    {
        if (!$parentFolderId) {
            return $this->getRootFolderId();
        }

        $parentFolder = Folder::find($parentFolderId);
        return $parentFolder?->drive_folder_id ?: $this->getRootFolderId();
    }
}
