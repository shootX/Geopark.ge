<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Checks BOTH the User model's `role` column AND Spatie roles for maximum compatibility.
     * This ensures the dual role system doesn't block legitimate users during migration.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        foreach ($roles as $role) {
            // Check 1: User model's `role` column (enum value)
            if ($user->role?->value === $role) {
                return $next($request);
            }

            // Check 2: Spatie role (for backward compatibility with Spatie-assigned roles)
            if (method_exists($user, 'hasRole') && $user->hasRole($role)) {
                return $next($request);
            }
        }

        return response()->json(['success' => false, 'message' => 'Forbidden. Insufficient permissions.'], 403);
    }
}
