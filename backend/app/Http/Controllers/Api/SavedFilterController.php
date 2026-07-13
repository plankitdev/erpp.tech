<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedFilter;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedFilterController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = SavedFilter::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhere('is_shared', true);
        });

        if ($scope = $request->input('scope')) {
            $query->where('scope', $scope);
        }

        $filters = $query->orderBy('name')->get();

        return $this->successResponse($filters);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:100',
            'scope'     => 'sometimes|string|max:50',
            'criteria'  => 'required|array',
            'is_shared' => 'sometimes|boolean',
        ]);
        $data['user_id'] = $request->user()->id;

        $filter = SavedFilter::create($data);

        return $this->successResponse($filter, 'تم حفظ الفلتر', 201);
    }

    public function update(Request $request, SavedFilter $savedFilter): JsonResponse
    {
        $this->authorizeOwner($request, $savedFilter);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:100',
            'criteria'  => 'sometimes|array',
            'is_shared' => 'sometimes|boolean',
        ]);
        $savedFilter->update($data);

        return $this->successResponse($savedFilter, 'تم تحديث الفلتر');
    }

    public function destroy(Request $request, SavedFilter $savedFilter): JsonResponse
    {
        $this->authorizeOwner($request, $savedFilter);
        $savedFilter->delete();

        return $this->successResponse(null, 'تم حذف الفلتر');
    }

    /**
     * Only the owner (or a manager) may mutate a saved filter.
     */
    private function authorizeOwner(Request $request, SavedFilter $filter): void
    {
        $user = $request->user();
        if ($filter->user_id !== $user->id
            && !$user->hasRole(['super_admin', 'company_admin', 'manager'])) {
            abort(403, 'لا تملك صلاحية تعديل هذا الفلتر');
        }
    }
}
