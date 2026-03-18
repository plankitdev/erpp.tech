<?php

namespace App\Traits;

trait ApiResponse
{
    protected function successResponse($data, string $message = 'تمت العملية بنجاح', int $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    protected function errorResponse(string $message, int $code = 400, $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $code);
    }

    /**
     * Get validated per_page value (capped at 100 to prevent abuse)
     */
    protected function getPerPage(int $default = 15, int $max = 100): int
    {
        $perPage = (int) request()->input('per_page', $default);
        return min(max($perPage, 1), $max);
    }

    protected function paginatedResponse($paginator, string $message = 'تمت العملية بنجاح')
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }
}
