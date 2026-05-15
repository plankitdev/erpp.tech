<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CostCenterController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = CostCenter::with('children')
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->boolean('root_only'), fn($q) => $q->whereNull('parent_id'))
            ->orderBy('code');

        if ($request->boolean('all')) {
            return $this->successResponse($query->get());
        }

        return $this->paginatedResponse($query->paginate($this->getPerPage(50)));
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $data = $request->validate([
            'parent_id' => 'nullable|exists:cost_centers,id',
            'code'      => "required|string|max:20|unique:cost_centers,code,NULL,id,company_id,{$companyId}",
            'name'      => 'required|string|max:255',
            'type'      => 'sometimes|in:department,project,branch',
        ], [
            'code.required' => 'رمز مركز التكلفة مطلوب',
            'code.unique'   => 'رمز مركز التكلفة مستخدم بالفعل',
            'name.required' => 'اسم مركز التكلفة مطلوب',
        ]);

        $center = CostCenter::create($data);
        return $this->successResponse($center, 'تم إنشاء مركز التكلفة بنجاح', 201);
    }

    public function show(CostCenter $costCenter): JsonResponse
    {
        return $this->successResponse($costCenter->load(['parent', 'children', 'fixedAssets']));
    }

    public function update(Request $request, CostCenter $costCenter): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $data = $request->validate([
            'parent_id' => 'nullable|exists:cost_centers,id',
            'code'      => "sometimes|string|max:20|unique:cost_centers,code,{$costCenter->id},id,company_id,{$companyId}",
            'name'      => 'sometimes|string|max:255',
            'type'      => 'sometimes|in:department,project,branch',
            'is_active' => 'sometimes|boolean',
        ], [
            'code.unique' => 'رمز مركز التكلفة مستخدم بالفعل',
        ]);

        // Prevent circular parent references
        if (isset($data['parent_id']) && $data['parent_id'] == $costCenter->id) {
            return $this->errorResponse('لا يمكن تعيين المركز كأب لنفسه', 422);
        }

        $costCenter->update($data);
        return $this->successResponse($costCenter->fresh(), 'تم تحديث مركز التكلفة بنجاح');
    }

    public function destroy(CostCenter $costCenter): JsonResponse
    {
        if ($costCenter->children()->exists()) {
            return $this->errorResponse('لا يمكن حذف مركز تكلفة له مراكز فرعية', 422);
        }

        if ($costCenter->journalLines()->exists()) {
            return $this->errorResponse('لا يمكن حذف مركز تكلفة مرتبط بقيود', 422);
        }

        $costCenter->delete();
        return $this->successResponse(null, 'تم حذف مركز التكلفة بنجاح');
    }
}
