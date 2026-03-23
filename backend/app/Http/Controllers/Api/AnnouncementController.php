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
        $userId = $request->user()->id;

        $announcements = Announcement::with(['creator', 'likes:id,name'])
            ->withCount('likes')
            ->withExists(['likes as is_liked' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }])
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

    public function toggleLike(Request $request, Announcement $announcement): JsonResponse
    {
        $userId = $request->user()->id;

        if ($announcement->likes()->where('user_id', $userId)->exists()) {
            $announcement->likes()->detach($userId);
            $message = 'تم إزالة الإعجاب';
        } else {
            $announcement->likes()->attach($userId);
            $message = 'تم الإعجاب';
        }

        return $this->successResponse([
            'likes_count' => $announcement->likes()->count(),
            'is_liked' => $announcement->likes()->where('user_id', $userId)->exists(),
        ], $message);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $lastRead = $request->user()->last_announcement_read_at;

        $query = Announcement::query();
        if ($lastRead) {
            $query->where('created_at', '>', $lastRead);
        }

        return $this->successResponse(['count' => $query->count()]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $request->user()->update(['last_announcement_read_at' => now()]);

        return $this->successResponse(null, 'تم التحديث');
    }
}
