<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\HasTags;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasCompany, SoftDeletes, HasFactory, LogsActivity, HasTags;

    public const STAGE_NEW              = 'new';
    public const STAGE_FIRST_CONTACT    = 'first_contact';
    public const STAGE_PROPOSAL_SENT    = 'proposal_sent';
    public const STAGE_NEGOTIATION      = 'negotiation';
    public const STAGE_CONTRACT_SIGNED  = 'contract_signed';
    public const STAGE_LOST             = 'lost';
    public const STAGES = [
        self::STAGE_NEW,
        self::STAGE_FIRST_CONTACT,
        self::STAGE_PROPOSAL_SENT,
        self::STAGE_NEGOTIATION,
        self::STAGE_CONTRACT_SIGNED,
        self::STAGE_LOST,
    ];

    public const TEMP_HOT  = 'hot';
    public const TEMP_WARM = 'warm';
    public const TEMP_COLD = 'cold';
    public const TEMPERATURES = [
        self::TEMP_HOT,
        self::TEMP_WARM,
        self::TEMP_COLD,
    ];

    public const SOURCE_AD       = 'ad';
    public const SOURCE_REFERRAL = 'referral';
    public const SOURCE_WEBSITE  = 'website';
    public const SOURCE_SOCIAL   = 'social';
    public const SOURCE_OTHER    = 'other';
    public const SOURCES = [
        self::SOURCE_AD,
        self::SOURCE_REFERRAL,
        self::SOURCE_WEBSITE,
        self::SOURCE_SOCIAL,
        self::SOURCE_OTHER,
    ];

    public const SERVICE_MARKETING   = 'marketing';
    public const SERVICE_DESIGN      = 'design';
    public const SERVICE_MODERATION  = 'moderation';
    public const SERVICE_DEVELOPMENT = 'development';
    public const SERVICE_OTHER       = 'other';
    public const SERVICE_TYPES = [
        self::SERVICE_MARKETING,
        self::SERVICE_DESIGN,
        self::SERVICE_MODERATION,
        self::SERVICE_DEVELOPMENT,
        self::SERVICE_OTHER,
    ];

    protected $fillable = [
        'company_id', 'name', 'phone', 'email', 'source',
        'service_type', 'expected_budget', 'stage', 'temperature',
        'lost_reason', 'first_contact_date', 'last_followup_date', 'notes',
        'proposal_file', 'proposed_amount', 'final_amount',
        'assigned_to', 'converted_client_id',
    ];

    protected $casts = [
        'expected_budget'    => 'decimal:2',
        'proposed_amount'    => 'decimal:2',
        'final_amount'       => 'decimal:2',
        'first_contact_date' => 'datetime:Y-m-d',
        'last_followup_date' => 'datetime:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function convertedClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'converted_client_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->orderByDesc('created_at');
    }
}
