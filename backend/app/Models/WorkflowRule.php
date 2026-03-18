<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowRule extends Model
{
    use HasCompany;

    // Triggers
    const TRIGGER_LEAD_CONVERTED = 'lead_converted';
    const TRIGGER_CONTRACT_EXPIRING = 'contract_expiring';
    const TRIGGER_CONTRACT_EXPIRED = 'contract_expired';
    const TRIGGER_INVOICE_OVERDUE = 'invoice_overdue';
    const TRIGGER_INVOICE_PAID = 'invoice_paid';
    const TRIGGER_TASK_COMPLETED = 'task_completed';

    const TRIGGERS = [
        self::TRIGGER_LEAD_CONVERTED,
        self::TRIGGER_CONTRACT_EXPIRING,
        self::TRIGGER_CONTRACT_EXPIRED,
        self::TRIGGER_INVOICE_OVERDUE,
        self::TRIGGER_INVOICE_PAID,
        self::TRIGGER_TASK_COMPLETED,
    ];

    // Actions
    const ACTION_CREATE_INVOICE = 'create_invoice';
    const ACTION_CREATE_TASK = 'create_task';
    const ACTION_SEND_NOTIFICATION = 'send_notification';
    const ACTION_UPDATE_STATUS = 'update_status';

    const ACTIONS = [
        self::ACTION_CREATE_INVOICE,
        self::ACTION_CREATE_TASK,
        self::ACTION_SEND_NOTIFICATION,
        self::ACTION_UPDATE_STATUS,
    ];

    protected $fillable = [
        'company_id',
        'name',
        'trigger',
        'conditions',
        'action',
        'action_config',
        'is_active',
        'executions_count',
        'last_executed_at',
    ];

    protected $casts = [
        'conditions' => 'array',
        'action_config' => 'array',
        'is_active' => 'boolean',
        'last_executed_at' => 'datetime',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(WorkflowLog::class);
    }
}
