<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalaryPaymentRequest;
use App\Http\Requests\UpdateSalaryPaymentRequest;
use App\Http\Resources\SalaryPaymentResource;
use App\Models\SalaryPayment;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryPaymentController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SalaryPayment::class);

        $query = SalaryPayment::with('employee');

        if ($month = $request->input('month')) {
            $query->where('month', $month);
        }
        if ($year = $request->input('year')) {
            $query->where('year', $year);
        }

        return $this->successResponse(SalaryPaymentResource::collection($query->get()));
    }

    public function store(StoreSalaryPaymentRequest $request): JsonResponse
    {
        $this->authorize('create', SalaryPayment::class);

        $salary = SalaryPayment::create($request->validated());
        return $this->successResponse(new SalaryPaymentResource($salary->load('employee')), 'تم تسجيل الراتب بنجاح', 201);
    }

    public function show(SalaryPayment $salaryPayment): JsonResponse
    {
        $this->authorize('view', $salaryPayment);

        return $this->successResponse(new SalaryPaymentResource($salaryPayment->load('employee')));
    }

    public function update(UpdateSalaryPaymentRequest $request, SalaryPayment $salaryPayment): JsonResponse
    {
        $this->authorize('update', $salaryPayment);

        $salaryPayment->update($request->validated());
        return $this->successResponse(new SalaryPaymentResource($salaryPayment), 'تم تحديث الراتب');
    }
}
