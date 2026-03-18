<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Contract::class);

        $contracts = Contract::with('client')
            ->when($request->search, fn($q) => $q->whereHas('client', fn($c) =>
                $c->where('name', 'like', "%{$request->search}%")
                  ->orWhere('company_name', 'like', "%{$request->search}%")
            ))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->client_id, fn($q) => $q->where('client_id', $request->client_id))
            ->latest()
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($contracts);
    }

    public function store(StoreContractRequest $request): JsonResponse
    {
        $this->authorize('create', Contract::class);

        $contract = Contract::create($request->validated());
        return $this->successResponse(
            new ContractResource($contract->load('client')),
            'تم إنشاء العقد بنجاح', 201
        );
    }

    public function show(Contract $contract): JsonResponse
    {
        $this->authorize('view', $contract);

        $contract->load(['client', 'invoices.payments']);
        return $this->successResponse(new ContractResource($contract));
    }

    public function update(UpdateContractRequest $request, Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);

        $contract->update($request->validated());
        return $this->successResponse(
            new ContractResource($contract->load('client')),
            'تم تحديث العقد'
        );
    }

    public function destroy(Contract $contract): JsonResponse
    {
        $this->authorize('delete', $contract);

        $contract->delete();
        return $this->successResponse(null, 'تم حذف العقد');
    }
}
