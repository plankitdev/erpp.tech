<?php

namespace App\Http\Controllers\Api;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    use ApiResponse;

    // ========== Channels ==========

    public function channels(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = ChatChannel::query();

        if ($user->isSuperAdmin()) {
            // Super admin sees all channels, with company info
            $query->with(['latestMessage.user:id,name', 'members:id,name,avatar', 'company:id,name']);
        } else {
            $query->whereHas('members', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->with(['latestMessage.user:id,name', 'members:id,name,avatar']);
        }

        $query->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->where('chat_messages.created_at', '>', function ($sub) use ($user) {
                    $sub->select('last_read_at')
                        ->from('chat_channel_members')
                        ->whereColumn('chat_channel_members.channel_id', 'chat_messages.channel_id')
                        ->where('chat_channel_members.user_id', $user->id);
                });
            }]);

        $channels = $query->orderByDesc(
                ChatMessage::select('created_at')
                    ->whereColumn('channel_id', 'chat_channels.id')
                    ->latest()
                    ->limit(1)
            )
            ->get();

        return $this->successResponse($channels);
    }

    public function createChannel(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:public,private,direct',
            'description' => 'nullable|string|max:500',
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        $user = Auth::user();

        // For direct messages, check if channel already exists
        if ($request->type === 'direct' && count($request->member_ids) === 1) {
            $otherUserId = $request->member_ids[0];
            $existing = ChatChannel::where('type', 'direct')
                ->where('company_id', $user->company_id)
                ->whereHas('members', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->whereHas('members', function ($q) use ($otherUserId) {
                    $q->where('user_id', $otherUserId);
                })
                ->first();

            if ($existing) {
                $existing->load(['members:id,name,avatar', 'latestMessage.user:id,name']);
                return $this->successResponse($existing, 'القناة موجودة بالفعل');
            }
        }

        $channel = ChatChannel::create([
            'company_id' => $user->company_id,
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'created_by' => $user->id,
        ]);

        // Add creator + members
        $memberIds = array_unique(array_merge([$user->id], $request->member_ids));
        $channel->members()->attach($memberIds);

        $channel->load(['members:id,name,avatar', 'latestMessage.user:id,name']);

        return $this->successResponse($channel, 'تم إنشاء القناة بنجاح', 201);
    }

    public function updateChannel(Request $request, ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();
        if ($channel->created_by !== $user->id && !$user->isSuperAdmin() && !$user->isManager()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $channel->update($request->only('name', 'description'));

        return $this->successResponse($channel, 'تم تحديث القناة');
    }

    public function deleteChannel(ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();
        if ($channel->created_by !== $user->id && !$user->isSuperAdmin()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $channel->messages()->delete();
        $channel->members()->detach();
        $channel->delete();

        return $this->successResponse(null, 'تم حذف القناة');
    }

    public function addMembers(Request $request, ChatChannel $channel): JsonResponse
    {
        $request->validate([
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        $channel->members()->syncWithoutDetaching($request->member_ids);
        $channel->load('members:id,name,avatar');

        return $this->successResponse($channel, 'تم إضافة الأعضاء');
    }

    public function removeMember(ChatChannel $channel, User $user): JsonResponse
    {
        $authUser = Auth::user();
        if ($channel->created_by !== $authUser->id && $authUser->id !== $user->id && !$authUser->isSuperAdmin()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $channel->members()->detach($user->id);

        return $this->successResponse(null, 'تم إزالة العضو');
    }

    // ========== Messages ==========

    public function messages(Request $request, ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();

        // Super admin can view any channel; others must be members
        if (!$user->isSuperAdmin() && !$channel->members()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $messages = $channel->messages()
            ->with('user:id,name,avatar')
            ->orderByDesc('created_at')
            ->paginate(50);

        // Mark as read if member
        if ($channel->members()->where('user_id', $user->id)->exists()) {
            $channel->members()->updateExistingPivot($user->id, ['last_read_at' => now()]);
        }

        return $this->paginatedResponse($messages);
    }

    public function sendMessage(Request $request, ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$channel->members()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $request->validate([
            'body' => 'required_without:attachment|string|max:5000',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $data = [
            'company_id' => $user->company_id,
            'channel_id' => $channel->id,
            'user_id' => $user->id,
            'body' => $request->body ?? '',
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('chat-attachments', 'public');
            $data['attachment'] = $path;
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        $message = ChatMessage::create($data);
        $message->load('user:id,name,avatar');

        // Update sender's read timestamp
        $channel->members()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return $this->successResponse($message, 'تم إرسال الرسالة', 201);
    }

    public function deleteMessage(ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        $user = Auth::user();

        if ($message->user_id !== $user->id && !$user->isSuperAdmin()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $message->delete();

        return $this->successResponse(null, 'تم حذف الرسالة');
    }

    public function markRead(ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();
        $channel->members()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return $this->successResponse(null, 'تم التحديث');
    }

    // ========== Users list for DM ==========

    public function users(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = User::where('id', '!=', $user->id)
            ->where('is_active', true)
            ->select('id', 'name', 'avatar', 'role', 'company_id');

        if (!$user->isSuperAdmin()) {
            $query->where('company_id', $user->company_id);
        }

        $users = $query->orderBy('name')->get();

        return $this->successResponse($users);
    }
}
