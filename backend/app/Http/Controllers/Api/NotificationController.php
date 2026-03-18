<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->where('user_id', auth()->id())
            ->latest()
            ->paginate($this->getPerPage(20));

        return $this->paginatedResponse($notifications);
    }

    public function unreadCount(): JsonResponse
    {
        $count = Notification::query()
            ->where('user_id', auth()->id())
            ->whereNull('read_at')
            ->count();

        return $this->successResponse(['count' => $count]);
    }

    public function markRead(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $notification->update(['read_at' => now()]);

        return $this->successResponse(new NotificationResource($notification), 'تم تحديد الإشعار كمقروء');
    }

    public function markAllRead(): JsonResponse
    {
        Notification::query()
            ->where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->successResponse(null, 'تم تحديد جميع الإشعارات كمقروءة');
    }
}
