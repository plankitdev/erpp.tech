<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * If a request has a ?token= query parameter but no Authorization header,
 * inject the token as a Bearer token so Laravel Sanctum can authenticate it.
 *
 * This is needed for browser-native EventSource (Server-Sent Events) which
 * cannot set custom request headers.
 */
class TokenFromQueryString
{
    public function handle(Request $request, Closure $next): mixed
    {
        if (!$request->bearerToken() && $request->query('token')) {
            $request->headers->set(
                'Authorization',
                'Bearer ' . $request->query('token')
            );
        }

        return $next($request);
    }
}
