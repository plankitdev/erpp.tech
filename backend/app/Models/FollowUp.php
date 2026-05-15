<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class FollowUp extends Model
{
    use HasCompany, HasFactory;

    // Types
    public const TYPE_TASK_OVERDUE       = 'task_overdue';
    public const TYPE_TASK_STUCK         = 'task_stuck';
    public const TYPE_TASK_NO_UPDATE     = 'task_no_update';
    public const TYPE_CONTRACT_EXPIRING  = 'contract_expiring';
    public const TYPE_INVOICE_UNPAID     = 'invoice_unpaid';
    public const TYPE_CLIENT_INACTIVE    = 'client_inactive';
    public const TYPE_MANUAL             = 'manual';

    public const TYPES = [
        self::TYPE_TASK_OVERDUE,
        self::TYPE_TASK_STUCK,
        self::TYPE_TASK_NO_UPDATE,
        self::TYPE_CONTRACT_EXPIRING,
        self::TYPE_INVOICE_UNPAID,
        self::TYPE_CLIENT_INACTIVE,
        self::TYPE_MANUAL,
    ];

    // Statuses
    public const STATUS_PENDING     = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED    = 'resolved';
    public const STATUS_DISMISSED   = 'dismissed';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_IN_PROGRESS,
        self::STATUS_RESOLVED,
        self::STATUS_DISMISSED,
    ];

    // Priorities
    public const PRIORITY_LOW      = 'low';
    public const PRIORITY_MEDIUM   = 'medium';
    public const PRIORITY_HIGH     = 'high';
    public const PRIORITY_CRITICAL = 'critical';

    public const PRIORITIES = [
        self::PRIORITY_LOW,
        self::PRIORITY_MEDIUM,
        self::PRIORITY_HIGH,
        self::PRIORITY_CRITICAL,
    ];

    protected $fillable = [
        'company_id', 'type', 'followable_type', 'followable_id',
        'assigned_to', 'created_by', 'status', 'priority',
        'note', 'due_date', 'resolved_at', 'auto_generated',
    ];

    protected $casts = [
        'due_date'       => 'datetime',
        'resolved_at'    => 'datetime',
        'auto_generated' => 'boolean',
    ];

    // ===== Relations =====

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function followable(): MorphTo
    {
        return $this->morphTo();
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ===== Scopes =====

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_IN_PROGRESS]);
    }

    public function scopeOverdue($query)
    {
        return $query->active()->where('due_date', '<', now());
    }

    // ===== Helpers =====

    public function resolve(?string $note = null): void
    {
        $this->update([
            'status'      => self::STATUS_RESOLVED,
            'resolved_at' => now(),
            'note'        => $note ? ($this->note ? $this->note . "\n---\n" . $note : $note) : $this->note,
        ]);
    }

    public function dismiss(?string $note = null): void
    {
        $this->update([
            'status'      => self::STATUS_DISMISSED,
            'resolved_at' => now(),
            'note'        => $note ? ($this->note ? $this->note . "\n---\n" . $note : $note) : $this->note,
        ]);
    }

    /**
     * Get Arabic label for the follow-up type.
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_TASK_OVERDUE      => 'مهمة متأخرة',
            self::TYPE_TASK_STUCK        => 'مهمة متوقفة',
            self::TYPE_TASK_NO_UPDATE    => 'مهمة بدون تحديث',
            self::TYPE_CONTRACT_EXPIRING => 'عقد قارب على الانتهاء',
            self::TYPE_INVOICE_UNPAID    => 'فاتورة غير مدفوعة',
            self::TYPE_CLIENT_INACTIVE   => 'عميل غير نشط',
            self::TYPE_MANUAL            => 'متابعة يدوية',
            default                      => $this->type,
        };
    }

    public function getPriorityLabelAttribute(): string
    {
        return match ($this->priority) {
            self::PRIORITY_LOW      => 'منخفض',
            self::PRIORITY_MEDIUM   => 'متوسط',
            self::PRIORITY_HIGH     => 'عالي',
            self::PRIORITY_CRITICAL => 'حرج',
            default                 => $this->priority,
        };
    }
}
