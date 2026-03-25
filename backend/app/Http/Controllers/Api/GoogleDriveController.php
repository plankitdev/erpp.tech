<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoogleDriveToken;
use App\Models\ManagedFile;
use App\Models\Folder;
use App\Traits\ApiResponse;
use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GoogleDriveController extends Controller
{
    use ApiResponse;

    private function getClient(): GoogleClient
    {
        $client = new GoogleClient();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect_uri'));
        $client->addScope(GoogleDrive::DRIVE_FILE);
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        return $client;
    }

    private function getCompanyId(): int
    {
        $user = auth()->user();
        $companyId = $user->company_id;

        if (!$companyId && $user->isSuperAdmin()) {
            $token = $user->currentAccessToken();
            if ($token) {
                foreach ($token->abilities ?? [] as $ability) {
                    if (str_starts_with($ability, 'company:')) {
                        $companyId = (int) substr($ability, 8);
                        break;
                    }
                }
            }
        }

        return $companyId;
    }

    /**
     * Get the OAuth URL for Google authorization
     */
    public function authUrl(): JsonResponse
    {
        $client = $this->getClient();
        $url = $client->createAuthUrl();
        return $this->successResponse(['url' => $url]);
    }

    /**
     * Handle the OAuth callback — receive the authorization code
     */
    public function callback(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $client = $this->getClient();
        $token = $client->fetchAccessTokenWithAuthCode($request->code);

        if (isset($token['error'])) {
            return $this->errorResponse('فشل الاتصال بجوجل: ' . ($token['error_description'] ?? $token['error']), 400);
        }

        $companyId = $this->getCompanyId();

        // Create root sync folder in Drive
        $client->setAccessToken($token);
        $drive = new GoogleDrive($client);

        $rootFolder = new DriveFile([
            'name' => 'ERPFlex Sync',
            'mimeType' => 'application/vnd.google-apps.folder',
        ]);
        $createdFolder = $drive->files->create($rootFolder, ['fields' => 'id']);

        GoogleDriveToken::updateOrCreate(
            ['company_id' => $companyId],
            [
                'access_token' => $token['access_token'],
                'refresh_token' => $token['refresh_token'] ?? null,
                'expires_at' => now()->addSeconds($token['expires_in'] ?? 3600),
                'drive_folder_id' => $createdFolder->id,
            ]
        );

        return $this->successResponse(null, 'تم ربط جوجل درايف بنجاح');
    }

    /**
     * Get the connection status
     */
    public function status(): JsonResponse
    {
        $companyId = $this->getCompanyId();
        $driveToken = GoogleDriveToken::where('company_id', $companyId)->first();

        if (!$driveToken) {
            return $this->successResponse([
                'connected' => false,
                'last_synced_at' => null,
            ]);
        }

        return $this->successResponse([
            'connected' => true,
            'last_synced_at' => $driveToken->last_synced_at?->format('Y-m-d H:i'),
        ]);
    }

    /**
     * Disconnect Google Drive
     */
    public function disconnect(): JsonResponse
    {
        $companyId = $this->getCompanyId();
        GoogleDriveToken::where('company_id', $companyId)->delete();
        return $this->successResponse(null, 'تم فصل جوجل درايف');
    }

    /**
     * Sync all managed files to Google Drive
     */
    public function sync(): JsonResponse
    {
        $companyId = $this->getCompanyId();
        $driveToken = GoogleDriveToken::where('company_id', $companyId)->first();

        if (!$driveToken) {
            return $this->errorResponse('جوجل درايف غير مربوط', 400);
        }

        $client = $this->getClient();
        $client->setAccessToken($driveToken->access_token);

        // Refresh token if expired
        if ($driveToken->expires_at && $driveToken->expires_at->isPast()) {
            if (!$driveToken->refresh_token) {
                return $this->errorResponse('انتهت صلاحية الاتصال، يرجى إعادة الربط', 401);
            }
            $client->fetchAccessTokenWithRefreshToken($driveToken->refresh_token);
            $newToken = $client->getAccessToken();
            $driveToken->update([
                'access_token' => $newToken['access_token'],
                'expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
            ]);
        }

        $drive = new GoogleDrive($client);
        $rootFolderId = $driveToken->drive_folder_id;

        // Get all folders and files
        $folders = Folder::where('company_id', $companyId)->get();
        $files = ManagedFile::where('company_id', $companyId)->get();

        $syncedFiles = 0;
        $errors = 0;

        // Map: local folder id => drive folder id
        $folderMap = [];

        // Create folder structure in Drive
        foreach ($this->buildFolderTree($folders) as $folder) {
            try {
                $parentId = $folder->parent_id && isset($folderMap[$folder->parent_id])
                    ? $folderMap[$folder->parent_id]
                    : $rootFolderId;

                $driveFolder = new DriveFile([
                    'name' => $folder->name,
                    'mimeType' => 'application/vnd.google-apps.folder',
                    'parents' => [$parentId],
                ]);

                // Check if folder already exists
                $existing = $drive->files->listFiles([
                    'q' => "name='" . addcslashes($folder->name, "'") . "' and '{$parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
                    'fields' => 'files(id)',
                    'pageSize' => 1,
                ]);

                if (count($existing->files) > 0) {
                    $folderMap[$folder->id] = $existing->files[0]->id;
                } else {
                    $created = $drive->files->create($driveFolder, ['fields' => 'id']);
                    $folderMap[$folder->id] = $created->id;
                }
            } catch (\Exception $e) {
                $errors++;
            }
        }

        // Upload files
        foreach ($files as $file) {
            try {
                $parentId = $file->folder_id && isset($folderMap[$file->folder_id])
                    ? $folderMap[$file->folder_id]
                    : $rootFolderId;

                // Check if file already exists
                $existing = $drive->files->listFiles([
                    'q' => "name='" . addcslashes($file->name, "'") . "' and '{$parentId}' in parents and trashed=false",
                    'fields' => 'files(id)',
                    'pageSize' => 1,
                ]);

                $filePath = Storage::disk('public')->path($file->file_path);

                if (!file_exists($filePath)) {
                    $errors++;
                    continue;
                }

                $driveFile = new DriveFile([
                    'name' => $file->name,
                    'parents' => [$parentId],
                ]);

                $content = file_get_contents($filePath);

                if (count($existing->files) > 0) {
                    // Update existing file
                    $drive->files->update($existing->files[0]->id, new DriveFile(['name' => $file->name]), [
                        'data' => $content,
                        'mimeType' => $file->mime_type,
                        'uploadType' => 'multipart',
                    ]);
                } else {
                    // Upload new file
                    $drive->files->create($driveFile, [
                        'data' => $content,
                        'mimeType' => $file->mime_type,
                        'uploadType' => 'multipart',
                        'fields' => 'id',
                    ]);
                }
                $syncedFiles++;
            } catch (\Exception $e) {
                $errors++;
            }
        }

        $driveToken->update(['last_synced_at' => now()]);

        return $this->successResponse([
            'synced_files' => $syncedFiles,
            'errors' => $errors,
            'total_files' => $files->count(),
            'total_folders' => $folders->count(),
        ], "تم مزامنة {$syncedFiles} ملف");
    }

    /**
     * Build ordered folder tree (parents before children)
     */
    private function buildFolderTree($folders): array
    {
        $result = [];
        $remaining = $folders->toArray();
        $processed = [];

        // First pass: root folders (no parent)
        foreach ($remaining as $key => $folder) {
            if (empty($folder['parent_id'])) {
                $result[] = (object) $folder;
                $processed[] = $folder['id'];
                unset($remaining[$key]);
            }
        }

        // Subsequent passes: children of already processed
        $maxPasses = 20;
        while (count($remaining) > 0 && $maxPasses-- > 0) {
            foreach ($remaining as $key => $folder) {
                if (in_array($folder['parent_id'], $processed)) {
                    $result[] = (object) $folder;
                    $processed[] = $folder['id'];
                    unset($remaining[$key]);
                }
            }
        }

        return $result;
    }
}
