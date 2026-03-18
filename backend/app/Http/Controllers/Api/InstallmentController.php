<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Installment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
    public function index(Contract $contract): JsonResponse
    {
        $installments = $contract->installments()->orderBy('installment_number')->get();

        return response()->json(['data' => $installments]);
    }

    public function generate(Contract $contract): JsonResponse
    {
        if ($contract->payment_type !== 'installments' || !$contract->installments_count) {
            return response()->json(['message' => 'هذا العقد ليس بنظام الأقساط'], 422);
        }

        if ($contract->installments()->exists()) {
            return response()->json(['message' => 'تم إنشاء الأقساط مسبقاً'], 422);
        }

        $installments = [];
        $startDate = $contract->start_date->copy();

        for ($i = 1; $i <= $contract->installments_count; $i++) {
            $installments[] = $contract->installments()->create([
                'company_id' => $contract->company_id,
                'installment_number' => $i,
                'amount' => $contract->installment_amount,
                'currency' => $contract->currency,
                'due_date' => $startDate->copy()->addMonths($i),
                'status' => 'pending',
            ]);
        }

        return response()->json(['data' => $installments, 'message' => 'تم إنشاء الأقساط بنجاح'], 201);
    }

    public function markPaid(Installment $installment, Request $request): JsonResponse
    {
        if ($installment->status === 'paid') {
            return response()->json(['message' => 'هذا القسط مدفوع بالفعل'], 422);
        }

        $installment->update([
            'status' => 'paid',
            'paid_date' => $request->input('paid_date', now()->toDateString()),
            'notes' => $request->input('notes'),
        ]);

        return response()->json(['data' => $installment, 'message' => 'تم تسجيل الدفع']);
    }
}
