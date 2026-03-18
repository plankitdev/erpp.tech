<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowLog extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'workflow_rule_id',
        'trigger',
        'action',
        'status',
        'entity_type',
        'entity_id',
        'result',
        'error',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(WorkflowRule::class, 'workflow_rule_id');
    }
}
