<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoogleDriveToken;
use App\Models\ManagedFile;
use App\Models\Folder;
use App\Services\GoogleDriveService;
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
        $driveService = GoogleDriveService::forCompany($companyId);

        if (!$driveService) {
            return $this->errorResponse('جوجل درايف غير مربوط أو انتهت الصلاحية', 400);
        }

        $result = $driveService->syncAll();

        return $this->successResponse($result, "تم مزامنة {$result['synced_files']} ملف");
    }
}
