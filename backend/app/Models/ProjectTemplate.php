<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;

class ProjectTemplate extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'default_tasks',
        'estimated_budget',
        'currency',
    ];

    protected $casts = [
        'default_tasks' => 'array',
        'estimated_budget' => 'decimal:2',
    ];
}
