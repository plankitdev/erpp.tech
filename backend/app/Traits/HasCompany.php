<?php

namespace App\Traits;

use App\Scopes\CompanyScope;

trait HasCompany
{
    protected static function bootHasCompany(): void
    {
        static::addGlobalScope(new CompanyScope());

        static::creating(function ($model) {
            if (auth()->check() && empty($model->company_id)) {
                $user = auth()->user();
                $companyId = $user->company_id;

                // Super admin: extract company from token abilities (company:X)
                if (!$companyId && $user->isSuperAdmin()) {
                    $token = $user->currentAccessToken();
                    if ($token) {
                        foreach ($token->abilities ?? [] as $ability) {
                            if (str_starts_with($ability, 'company:')) {
                                $companyId = (int) substr($ability, 8);
                                break;
                            }
                        }
                    }
                }

                $model->company_id = $companyId;
            }
        });
    }
}
