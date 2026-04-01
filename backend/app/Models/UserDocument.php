<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDocument extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'user_id', 'template_id', 'title',
        'schema_snapshot', 'data', 'status',
        'folder_id', 'managed_file_id', 'project_id', 'client_id',
    ];

    protected $casts = [
        'schema_snapshot' => 'array',
        'data'            => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function managedFile(): BelongsTo
    {
        return $this->belongsTo(ManagedFile::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
