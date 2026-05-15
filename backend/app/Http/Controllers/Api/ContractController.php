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

        // Auto-generate installments if payment_type is installments
        if ($contract->payment_type === Contract::PAYMENT_TYPE_INSTALLMENTS
            && $contract->installments_count > 0
        ) {
            $startDate = $contract->start_date->copy();
            $installmentAmount = $contract->installment_amount
                ?? round($contract->value / $contract->installments_count, 2);

            for ($i = 1; $i <= $contract->installments_count; $i++) {
                $contract->installments()->create([
                    'company_id'         => $contract->company_id,
                    'installment_number' => $i,
                    'amount'             => $installmentAmount,
                    'currency'           => $contract->currency,
                    'due_date'           => $startDate->copy()->addMonths($i),
                    'status'             => 'pending',
                ]);
            }

            // Store the installment_amount if it was auto-calculated
            if (!$contract->installment_amount) {
                $contract->update(['installment_amount' => $installmentAmount]);
            }
        }

        // Auto-generate first invoice for monthly contracts
        if ($contract->payment_type === Contract::PAYMENT_TYPE_MONTHLY) {
            $monthlyAmount = $contract->installment_amount ?? round($contract->value / 12, 2);

            // Set due_date based on client's payment_day if available
            $dueDate = now()->endOfMonth();
            $client = $contract->client;
            if ($client && $client->payment_day) {
                $day = min($client->payment_day, now()->daysInMonth);
                $dueDate = now()->day($day);
                if ($dueDate->isPast()) {
                    $dueDate = $dueDate->addMonth();
                }
            }

            \App\Models\Invoice::create([
                'contract_id' => $contract->id,
                'company_id'  => $contract->company_id,
                'client_id'   => $contract->client_id,
                'amount'      => $monthlyAmount,
                'currency'    => $contract->currency,
                'status'      => 'pending',
                'issue_date'  => now()->toDateString(),
                'due_date'    => $dueDate,
            ]);
        }

        return $this->successResponse(
            new ContractResource($contract->load(['client', 'installments'])),
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
