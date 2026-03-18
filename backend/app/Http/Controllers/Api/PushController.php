<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'subscription' => 'required|array',
            'subscription.endpoint' => 'required|url',
            'subscription.keys.p256dh' => 'nullable|string',
            'subscription.keys.auth' => 'nullable|string',
        ]);

        $sub = $request->input('subscription');

        PushSubscription::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'endpoint' => $sub['endpoint'],
            ],
            [
                'company_id' => $request->user()->company_id,
                'p256dh' => $sub['keys']['p256dh'] ?? null,
                'auth' => $sub['keys']['auth'] ?? null,
            ]
        );

        return response()->json(['success' => true, 'message' => 'تم تفعيل الإشعارات']);
    }

    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint', $request->input('endpoint'))
            ->delete();

        return response()->json(['success' => true, 'message' => 'تم إلغاء الإشعارات']);
    }
}
