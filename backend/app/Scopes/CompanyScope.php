<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class CompanyScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check()) {
            $user = auth()->user();

            // Super admin: scope by selected company from token abilities
            if ($user->isSuperAdmin()) {
                $token = $user->currentAccessToken();
                if ($token) {
                    foreach ($token->abilities ?? [] as $ability) {
                        if (str_starts_with($ability, 'company:')) {
                            $companyId = (int) substr($ability, 8);
                            $builder->where($model->getTable() . '.company_id', $companyId);
                            return;
                        }
                    }
                }
                // No company selected via token — fall back to user's company_id if set
                if ($user->company_id) {
                    $builder->where($model->getTable() . '.company_id', $user->company_id);
                }
                // If company_id is also null, show all (true super admin)
                return;
            }

            $companyId = $user->company_id;
            if ($companyId) {
                $builder->where($model->getTable() . '.company_id', $companyId);
            }
        }
    }
}
