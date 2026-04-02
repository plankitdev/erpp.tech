<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatMessage extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'channel_id',
        'user_id',
        'body',
        'attachment',
        'attachment_name',
        'reply_to_id',
        'is_edited',
        'edited_at',
        'is_pinned',
        'pinned_by',
        'pinned_at',
    ];

    protected $casts = [
        'is_edited' => 'boolean',
        'is_pinned' => 'boolean',
        'edited_at' => 'datetime',
        'pinned_at' => 'datetime',
    ];

    public function channel(): BelongsTo
    {
        return $this->belongsTo(ChatChannel::class, 'channel_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'reply_to_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(ChatMessageReaction::class, 'message_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(ChatMessageRead::class, 'message_id');
    }

    public function pinnedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pinned_by');
    }
}
