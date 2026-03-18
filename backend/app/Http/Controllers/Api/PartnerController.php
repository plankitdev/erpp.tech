<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePartnerRequest;
use App\Http\Requests\StorePartnerPaymentRequest;
use App\Http\Resources\PartnerResource;
use App\Models\Partner;
use App\Models\PartnerPayment;
use App\Services\PartnerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    use ApiResponse;

    public function __construct(private PartnerService $partnerService)
    {
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Partner::class);

        $partners = Partner::withCount('payments')
            ->withSum('payments', 'amount')
            ->get();

        return $this->successResponse(PartnerResource::collection($partners));
    }

    public function store(StorePartnerRequest $request): JsonResponse
    {
        $this->authorize('create', Partner::class);

        $partner = Partner::create($request->validated());
        return $this->successResponse(new PartnerResource($partner), 'تم إضافة الشريك بنجاح', 201);
    }

    public function update(StorePartnerRequest $request, Partner $partner): JsonResponse
    {
        $this->authorize('update', $partner);

        $partner->update($request->validated());
        return $this->successResponse(new PartnerResource($partner), 'تم تحديث بيانات الشريك');
    }

    public function destroy(Partner $partner): JsonResponse
    {
        $this->authorize('delete', $partner);

        $partner->delete();
        return $this->successResponse(null, 'تم حذف الشريك');
    }

    public function monthlyProfit(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Partner::class);

        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);

        $data = $this->partnerService->getMonthlyProfitData($month, $year);

        return $this->successResponse($data);
    }

    public function statement(Partner $partner, Request $request): JsonResponse
    {
        $this->authorize('view', $partner);

        $year = (int) $request->input('year', now()->year);
        $data = $this->partnerService->getPartnerStatement($partner->id, $year);

        return $this->successResponse($data);
    }

    public function recordPayment(StorePartnerPaymentRequest $request, Partner $partner): JsonResponse
    {
        $this->authorize('create', Partner::class);

        $payment = PartnerPayment::create([
            'partner_id'   => $partner->id,
            ...$request->validated(),
        ]);

        return $this->successResponse($payment, 'تم تسجيل الدفعة بنجاح', 201);
    }

    public function payments(Partner $partner, Request $request): JsonResponse
    {
        $this->authorize('view', $partner);

        $payments = $partner->payments()
            ->when($request->year, fn($q) => $q->where('year', $request->year))
            ->when($request->month, fn($q) => $q->where('month', $request->month))
            ->latest('payment_date')
            ->paginate($this->getPerPage(20));

        return $this->paginatedResponse($payments);
    }

    public function deletePayment(Partner $partner, PartnerPayment $payment): JsonResponse
    {
        $this->authorize('delete', $partner);

        if ($payment->partner_id !== $partner->id) {
            return $this->errorResponse('هذه الدفعة لا تخص هذا الشريك', 403);
        }

        $payment->delete();
        return $this->successResponse(null, 'تم حذف الدفعة');
    }

    public function profits(): JsonResponse
    {
        $this->authorize('viewAny', Partner::class);

        return $this->monthlyProfit(request());
    }
}
