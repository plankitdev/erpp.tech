<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    use HasCompany;

    protected $fillable = ['company_id', 'name', 'color'];

    public function clients(): MorphToMany
    {
        return $this->morphedByMany(Client::class, 'taggable');
    }

    public function tasks(): MorphToMany
    {
        return $this->morphedByMany(Task::class, 'taggable');
    }

    public function projects(): MorphToMany
    {
        return $this->morphedByMany(Project::class, 'taggable');
    }

    public function leads(): MorphToMany
    {
        return $this->morphedByMany(Lead::class, 'taggable');
    }
}
