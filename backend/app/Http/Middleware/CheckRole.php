<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$params): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Super admin always has access
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // Check if user's role matches any of the params
        if (in_array($user->role, $params)) {
            return $next($request);
        }

        // Check if user has custom permissions matching any param
        foreach ($params as $param) {
            if ($user->canAccess($param)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'غير مصرح لك بالوصول.'], 403);
    }
}
