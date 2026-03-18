<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PlatformEmail;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailController extends Controller
{
    use ApiResponse;

    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
        ]);

        Mail::to($data['to'])->send(
            new PlatformEmail($data['subject'], $data['body'], $request->user()->name)
        );

        return $this->successResponse(null, 'تم إرسال البريد الإلكتروني بنجاح');
    }

    public function sendInvoice(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'to' => 'required|email',
            'message' => 'nullable|string|max:2000',
        ]);

        $invoice->load('contract.client');
        $clientName = $invoice->contract?->client?->name ?? 'العميل';
        $body = $data['message'] ?? "مرفق فاتورة رقم {$invoice->id} بمبلغ {$invoice->amount} {$invoice->currency}.";

        Mail::to($data['to'])->send(
            new PlatformEmail(
                "فاتورة #{$invoice->id} — {$clientName}",
                $body,
                $request->user()->name
            )
        );

        return $this->successResponse(null, 'تم إرسال الفاتورة بالبريد الإلكتروني');
    }

    public function sendQuotation(Request $request, Quotation $quotation): JsonResponse
    {
        $data = $request->validate([
            'to' => 'required|email',
            'message' => 'nullable|string|max:2000',
        ]);

        $quotation->load('client');
        $clientName = $quotation->client?->name ?? 'العميل';
        $body = $data['message'] ?? "مرفق عرض سعر {$quotation->reference} بمبلغ {$quotation->total} {$quotation->currency}.";

        Mail::to($data['to'])->send(
            new PlatformEmail(
                "عرض سعر {$quotation->reference} — {$clientName}",
                $body,
                $request->user()->name
            )
        );

        if ($quotation->status === Quotation::STATUS_DRAFT) {
            $quotation->update(['status' => Quotation::STATUS_SENT]);
        }

        return $this->successResponse(null, 'تم إرسال عرض السعر بالبريد الإلكتروني');
    }
}
