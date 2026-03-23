<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::with('creator')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($announcements);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'priority' => 'sometimes|in:normal,important,urgent',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $data['created_by'] = $request->user()->id;

        $announcement = Announcement::create($data);

        return $this->successResponse(
            $announcement->load('creator'),
            'تم نشر التحديث',
            201
        );
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string|max:5000',
            'priority' => 'sometimes|in:normal,important,urgent',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $announcement->update($data);

        return $this->successResponse(
            $announcement->load('creator'),
            'تم تحديث الإعلان'
        );
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return $this->successResponse(null, 'تم حذف الإعلان');
    }
}
