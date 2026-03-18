<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadActivity extends Model
{
    use HasFactory;

    public const TYPE_CALL          = 'call';
    public const TYPE_MESSAGE       = 'message';
    public const TYPE_EMAIL         = 'email';
    public const TYPE_PROPOSAL_SENT = 'proposal_sent';
    public const TYPE_MEETING       = 'meeting';
    public const TYPE_FOLLOWUP      = 'followup';
    public const TYPES = [
        self::TYPE_CALL,
        self::TYPE_MESSAGE,
        self::TYPE_EMAIL,
        self::TYPE_PROPOSAL_SENT,
        self::TYPE_MEETING,
        self::TYPE_FOLLOWUP,
    ];

    public const OUTCOME_POSITIVE = 'positive';
    public const OUTCOME_NEUTRAL  = 'neutral';
    public const OUTCOME_NEGATIVE = 'negative';
    public const OUTCOMES = [
        self::OUTCOME_POSITIVE,
        self::OUTCOME_NEUTRAL,
        self::OUTCOME_NEGATIVE,
    ];

    protected $fillable = [
        'lead_id', 'user_id', 'type', 'notes',
        'attachment', 'outcome', 'next_followup_date',
    ];

    protected $casts = [
        'next_followup_date' => 'datetime:Y-m-d',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
