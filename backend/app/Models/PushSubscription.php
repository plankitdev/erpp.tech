<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    use HasCompany;

    protected $fillable = [
        'user_id',
        'company_id',
        'endpoint',
        'p256dh',
        'auth',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
