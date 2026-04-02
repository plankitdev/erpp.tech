<?php

namespace App\Http\Controllers\Api;

use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\ChatMessageReaction;
use App\Models\ChatMessageRead;
use App\Models\User;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    use ApiResponse;

    // ========== Channels ==========

    public function channels(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Auto-join user to public channels of their company
        $this->autoJoinPublicChannels($user);

        $query = ChatChannel::query()
            ->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['latestMessage.user:id,name', 'members:id,name,avatar']);

        if ($user->isSuperAdmin()) {
            $query->with('company:id,name');
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
            'company_id' => $user->isSuperAdmin() ? ($this->getSuperAdminCompanyId($user) ?? $user->company_id) : $user->company_id,
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'created_by' => $user->id,
        ]);

        // Add creator + members
        $memberIds = array_unique(array_merge([$user->id], $request->member_ids));

        // For public channels, add all company users
        if ($request->type === 'public') {
            $companyId = $user->isSuperAdmin() ? ($this->getSuperAdminCompanyId($user) ?? $user->company_id) : $user->company_id;
            $companyUserIds = User::where('company_id', $companyId)->where('is_active', true)->pluck('id')->toArray();
            $memberIds = array_unique(array_merge($memberIds, $companyUserIds));
        }

        $channel->members()->syncWithoutDetaching($memberIds);

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
        // المنشئ أو الأدمن أو المدير يقدروا يحذفوا القناة
        if ($channel->created_by !== $user->id && !$user->isSuperAdmin() && !$user->isManager()) {
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
            ->with(['user:id,name,avatar', 'replyTo:id,body,user_id,attachment_name', 'replyTo.user:id,name', 'reactions.user:id,name', 'reads.user:id,name'])
            ->orderByDesc('created_at')
            ->paginate(50);

        // Mark as read if member — both channel pivot AND individual message reads
        if ($channel->members()->where('user_id', $user->id)->exists()) {
            $channel->members()->updateExistingPivot($user->id, ['last_read_at' => now()]);

            // Bulk insert read receipts for messages not yet read
            $messageIds = $messages->pluck('id')->toArray();
            $alreadyRead = ChatMessageRead::where('user_id', $user->id)
                ->whereIn('message_id', $messageIds)
                ->pluck('message_id')
                ->toArray();
            $toInsert = array_diff($messageIds, $alreadyRead);
            if (!empty($toInsert)) {
                $rows = array_map(fn($id) => [
                    'message_id' => $id,
                    'user_id' => $user->id,
                    'read_at' => now(),
                ], $toInsert);
                ChatMessageRead::insert($rows);
            }
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
            'reply_to_id' => 'nullable|integer|exists:chat_messages,id',
        ]);

        $data = [
            'company_id' => $user->company_id ?? $channel->company_id,
            'channel_id' => $channel->id,
            'user_id' => $user->id,
            'body' => $request->body ?? '',
            'reply_to_id' => $request->reply_to_id,
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('chat-attachments', 'public');
            $data['attachment'] = $path;
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        $message = ChatMessage::create($data);
        $message->load(['user:id,name,avatar', 'replyTo:id,body,user_id,attachment_name', 'replyTo.user:id,name']);

        // Send notifications for @mentions
        if ($request->body && $user->company_id && preg_match_all('/@\[([^\]]+)\]\((\d+)\)/', $request->body, $matches)) {
            $channelName = $channel->type === 'direct'
                ? 'رسالة مباشرة'
                : $channel->name;

            foreach ($matches[2] as $mentionedUserId) {
                $mentionedUserId = (int) $mentionedUserId;
                if ($mentionedUserId !== $user->id) {
                    NotificationService::chatMention(
                        $user->company_id,
                        $mentionedUserId,
                        $user->name,
                        $channelName,
                        '/chat'
                    );
                }
            }
        }

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

    public function toggleReaction(Request $request, ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$channel->members()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $request->validate(['emoji' => 'required|string|max:10']);

        $existing = ChatMessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $request->emoji)
            ->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            ChatMessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $request->emoji,
            ]);
            $action = 'added';
        }

        $reactions = $message->reactions()->with('user:id,name')->get();

        return $this->successResponse(['action' => $action, 'reactions' => $reactions]);
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

        if ($user->isSuperAdmin()) {
            // Super admin: show users of the company they switched to
            $companyId = $this->getSuperAdminCompanyId($user);
            if ($companyId) {
                $query->where('company_id', $companyId);
            }
        } else {
            // Regular users: show company users + super admins
            $query->where(function ($q) use ($user) {
                $q->where('company_id', $user->company_id)
                  ->orWhere('role', 'super_admin');
            });
        }

        $users = $query->orderBy('name')->get();

        return $this->successResponse($users);
    }

    public function totalUnread(): JsonResponse
    {
        $user = Auth::user();

        $count = ChatChannel::query()
            ->whereHas('members', fn($q) => $q->where('user_id', $user->id))
            ->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->where('chat_messages.created_at', '>', function ($sub) use ($user) {
                    $sub->select('last_read_at')
                        ->from('chat_channel_members')
                        ->whereColumn('chat_channel_members.channel_id', 'chat_messages.channel_id')
                        ->where('chat_channel_members.user_id', $user->id);
                });
            }])
            ->get()
            ->sum('unread_count');

        return $this->successResponse(['count' => (int)$count]);
    }

    // ========== Edit Message ==========

    public function editMessage(Request $request, ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        $user = Auth::user();

        if ($message->user_id !== $user->id) {
            return $this->errorResponse('غير مسموح — يمكنك تعديل رسائلك فقط', 403);
        }

        $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $message->update([
            'body' => $request->body,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        $message->load(['user:id,name,avatar', 'reactions.user:id,name', 'reads.user:id,name']);

        return $this->successResponse($message, 'تم تعديل الرسالة');
    }

    // ========== Search Messages ==========

    public function searchMessages(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'q' => 'required|string|min:2|max:200',
            'channel_id' => 'nullable|integer|exists:chat_channels,id',
        ]);

        $query = ChatMessage::query()
            ->whereIn('channel_id', function ($sub) use ($user) {
                $sub->select('channel_id')
                    ->from('chat_channel_members')
                    ->where('user_id', $user->id);
            })
            ->where('body', 'like', '%' . $request->q . '%')
            ->with(['user:id,name,avatar', 'channel:id,name,type']);

        if ($request->channel_id) {
            $query->where('channel_id', $request->channel_id);
        }

        $results = $query->orderByDesc('created_at')->limit(50)->get();

        return $this->successResponse($results);
    }

    // ========== Pin / Unpin Message ==========

    public function togglePin(ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        $user = Auth::user();

        // Only creator, super_admin, manager, company_admin can pin
        if ($channel->created_by !== $user->id && !$user->isSuperAdmin() && !$user->isManager() && !$user->hasRole('company_admin')) {
            return $this->errorResponse('غير مسموح — الأدمن والمدير فقط', 403);
        }

        if ($message->is_pinned) {
            $message->update(['is_pinned' => false, 'pinned_by' => null, 'pinned_at' => null]);
            return $this->successResponse($message, 'تم إلغاء التثبيت');
        }

        $message->update([
            'is_pinned' => true,
            'pinned_by' => $user->id,
            'pinned_at' => now(),
        ]);

        $message->load('pinnedByUser:id,name');

        return $this->successResponse($message, 'تم تثبيت الرسالة');
    }

    public function pinnedMessages(ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$channel->members()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $pinned = $channel->messages()
            ->where('is_pinned', true)
            ->with(['user:id,name,avatar', 'pinnedByUser:id,name'])
            ->orderByDesc('pinned_at')
            ->get();

        return $this->successResponse($pinned);
    }

    // ========== Read Receipts ==========

    public function messageReads(ChatChannel $channel, ChatMessage $message): JsonResponse
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$channel->members()->where('user_id', $user->id)->exists()) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $reads = $message->reads()->with('user:id,name,avatar')->orderByDesc('read_at')->get();

        return $this->successResponse($reads);
    }

    // ========== Typing Indicator ==========

    public function typing(Request $request, ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();

        // Upsert typing record
        DB::table('chat_typing')->updateOrInsert(
            ['channel_id' => $channel->id, 'user_id' => $user->id],
            ['started_at' => now()]
        );

        return $this->successResponse(null);
    }

    public function typingUsers(ChatChannel $channel): JsonResponse
    {
        $user = Auth::user();

        // Only show users who typed in the last 5 seconds
        $typing = DB::table('chat_typing')
            ->join('users', 'users.id', '=', 'chat_typing.user_id')
            ->where('chat_typing.channel_id', $channel->id)
            ->where('chat_typing.user_id', '!=', $user->id)
            ->where('chat_typing.started_at', '>=', now()->subSeconds(5))
            ->select('users.id', 'users.name')
            ->get();

        return $this->successResponse($typing);
    }

    private function autoJoinPublicChannels($user): void
    {
        $companyId = $user->isSuperAdmin() ? $this->getSuperAdminCompanyId($user) : $user->company_id;
        if (!$companyId) return;

        $publicChannelIds = ChatChannel::where('company_id', $companyId)
            ->where('type', 'public')
            ->whereDoesntHave('members', fn($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        foreach ($publicChannelIds as $channelId) {
            \DB::table('chat_channel_members')->insert([
                'channel_id' => $channelId,
                'user_id' => $user->id,
                'last_read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function getSuperAdminCompanyId($user): ?int
    {
        $token = $user->currentAccessToken();
        if ($token) {
            foreach ($token->abilities ?? [] as $ability) {
                if (str_starts_with($ability, 'company:')) {
                    return (int) substr($ability, 8);
                }
            }
        }
        return null;
    }
}
