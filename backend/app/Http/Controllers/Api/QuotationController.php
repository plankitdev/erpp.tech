<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Quotation::with(['client', 'lead', 'creator']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->client_id) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'LIKE', "%{$search}%")
                  ->orWhere('subject', 'LIKE', "%{$search}%");
            });
        }

        $quotations = $query->latest()->paginate($this->getPerPage());
        return $this->paginatedResponse($quotations);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:leads,id',
            'subject' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'currency' => 'sometimes|in:EGP,USD,SAR',
            'valid_until' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', Quotation::STATUSES),
        ]);

        $items = $data['items'];
        $subtotal = array_sum(array_map(fn ($item) => $item['quantity'] * $item['unit_price'], $items));
        $discount = $data['discount'] ?? 0;
        $taxRate = $data['tax_rate'] ?? 0;
        $taxAmount = ($subtotal - $discount) * ($taxRate / 100);
        $total = $subtotal - $discount + $taxAmount;

        $data['reference'] = Quotation::generateReference(auth()->user()->company_id);
        $data['created_by'] = auth()->id();
        $data['subtotal'] = $subtotal;
        $data['tax_amount'] = $taxAmount;
        $data['total'] = $total;

        $quotation = Quotation::create($data);

        return $this->successResponse(
            new QuotationResource($quotation->load(['client', 'lead', 'creator'])),
            'تم إنشاء عرض السعر بنجاح',
            201
        );
    }

    public function show(Quotation $quotation): JsonResponse
    {
        $quotation->load(['client', 'lead', 'creator']);
        return $this->successResponse(new QuotationResource($quotation));
    }

    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        $data = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:leads,id',
            'subject' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'items' => 'sometimes|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'currency' => 'sometimes|in:EGP,USD,SAR',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', Quotation::STATUSES),
        ]);

        if (isset($data['items'])) {
            $items = $data['items'];
            $subtotal = array_sum(array_map(fn ($item) => $item['quantity'] * $item['unit_price'], $items));
            $discount = $data['discount'] ?? $quotation->discount;
            $taxRate = $data['tax_rate'] ?? $quotation->tax_rate;
            $taxAmount = ($subtotal - $discount) * ($taxRate / 100);
            $data['subtotal'] = $subtotal;
            $data['tax_amount'] = $taxAmount;
            $data['total'] = $subtotal - $discount + $taxAmount;
        }

        $quotation->update($data);

        return $this->successResponse(
            new QuotationResource($quotation->load(['client', 'lead', 'creator'])),
            'تم تحديث عرض السعر'
        );
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        $quotation->delete();
        return $this->successResponse(null, 'تم حذف عرض السعر');
    }

    public function downloadPdf(Quotation $quotation)
    {
        $quotation->load(['client', 'lead', 'creator', 'company']);

        $statusLabels = [
            'draft' => 'مسودة',
            'sent' => 'مُرسل',
            'accepted' => 'مقبول',
            'rejected' => 'مرفوض',
            'expired' => 'منتهي',
        ];

        $html = view('pdf.quotation', [
            'quotation' => $quotation,
            'company' => $quotation->company,
            'statusLabel' => $statusLabels[$quotation->status] ?? $quotation->status,
        ])->render();

        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4');

        return $pdf->download("quotation-{$quotation->reference}.pdf");
    }
}
