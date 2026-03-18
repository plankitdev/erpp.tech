<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            static::logAction($model, 'created');
        });

        static::updated(function ($model) {
            if ($model->isDirty()) {
                static::logAction($model, 'updated', $model->getChanges());
            }
        });

        static::deleted(function ($model) {
            static::logAction($model, 'deleted');
        });
    }

    protected static function logAction($model, string $action, array $changes = []): void
    {
        $companyId = $model->company_id ?? auth()->user()?->company_id;
        if (!$companyId) return;

        ActivityLog::create([
            'company_id' => $companyId,
            'user_id' => auth()->id(),
            'action' => $action,
            'model_type' => class_basename($model),
            'model_id' => $model->id,
            'changes' => !empty($changes) ? $changes : null,
        ]);
    }
}
