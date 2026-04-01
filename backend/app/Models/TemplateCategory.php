<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateCategory extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'name', 'slug', 'color', 'icon', 'sort_order',
    ];

    public function templates(): HasMany
    {
        return $this->hasMany(Template::class, 'category_id');
    }
}
