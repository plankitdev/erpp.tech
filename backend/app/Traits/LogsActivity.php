<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    /** Fields to exclude from change logs */
    protected static function logExcluded(): array
    {
        return ['password', 'remember_token', 'updated_at', 'created_at'];
    }

    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            static::logAction($model, 'created');
        });

        static::updated(function ($model) {
            $dirty = collect($model->getDirty())->except(static::logExcluded());
            if ($dirty->isEmpty()) return;

            $old = collect($model->getOriginal())->only($dirty->keys())->toArray();
            $new = $dirty->toArray();

            static::logAction($model, 'updated', ['old' => $old, 'new' => $new]);
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
