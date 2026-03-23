<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\UpdateInvoiceRequest;
use App\Http\Requests\RecordPaymentRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Services\NotificationService;
use App\Services\WorkflowService;
use App\Models\WorkflowRule;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Invoice::class);

        $invoices = Invoice::with(['contract.client', 'payments'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->client_id, fn($q) =>
                $q->whereHas('contract', fn($cq) => $cq->where('client_id', $request->client_id))
            )
            ->when($request->month, fn($q) => $q->whereMonth('due_date', $request->month))
            ->when($request->year, fn($q) => $q->whereYear('due_date', $request->year))
            ->latest()
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($invoices);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $this->authorize('create', Invoice::class);

        $data = $request->validated();
        $isPaid = !empty($data['is_paid']);
        unset($data['is_paid']);

        if ($isPaid) {
            $data['status'] = Invoice::STATUS_PAID;
            $data['paid_date'] = now();
        } else {
            $data['status'] = Invoice::STATUS_PENDING;
        }

        $invoice = Invoice::create($data);

        if ($isPaid) {
            $invoice->payments()->create([
                'amount'  => $invoice->amount,
                'paid_at' => now(),
                'notes'   => 'دفع كامل عند إنشاء الفاتورة',
            ]);
        }

        $message = $isPaid ? 'تم إنشاء الفاتورة وتسجيل الدفع بنجاح' : 'تم إنشاء الفاتورة بنجاح';
        return $this->successResponse(
            new InvoiceResource($invoice->load(['contract.client', 'payments'])),
            $message, 201
        );
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);

        $invoice->load(['contract.client', 'payments']);
        return $this->successResponse(new InvoiceResource($invoice));
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('update', $invoice);

        $invoice->update($request->validated());
        return $this->successResponse(new InvoiceResource($invoice), 'تم تحديث الفاتورة');
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->authorize('delete', $invoice);

        $invoice->payments()->delete();
        $invoice->delete();
        return $this->successResponse(null, 'تم حذف الفاتورة');
    }

    public function batchDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', Invoice::class);

        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:invoices,id']);
        InvoicePayment::whereIn('invoice_id', $request->ids)->delete();
        Invoice::whereIn('id', $request->ids)->delete();
        return $this->successResponse(null, 'تم حذف الفواتير المحددة');
    }

    public function recordPayment(RecordPaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('recordPayment', $invoice);

        return DB::transaction(function () use ($request, $invoice) {
            InvoicePayment::create([
                'invoice_id' => $invoice->id,
                'amount'     => $request->amount,
                'paid_at'    => now(),
                'notes'      => $request->notes,
            ]);

            $totalPaid = $invoice->payments()->sum('amount');
            if ($totalPaid >= $invoice->amount) {
                $invoice->update(['status' => Invoice::STATUS_PAID, 'paid_date' => now()]);
                WorkflowService::fire(WorkflowRule::TRIGGER_INVOICE_PAID, $invoice->company_id, $invoice);
            } else {
                $invoice->update(['status' => Invoice::STATUS_PARTIAL]);
            }

            $clientName = $invoice->contract?->client?->name ?? 'غير محدد';
            NotificationService::paymentReceived($invoice->company_id, $clientName, number_format($request->amount));

            return $this->successResponse(
                new InvoiceResource($invoice->fresh()->load('payments')),
                'تم تسجيل الدفعة بنجاح'
            );
        });
    }

    public function downloadPdf(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load(['contract.client', 'payments', 'company']);
        $statusLabels = [
            'pending' => 'قيد الانتظار',
            'paid' => 'مدفوعة',
            'overdue' => 'متأخرة',
            'partial' => 'مدفوعة جزئياً',
        ];

        $currencyNames = [
            'EGP' => 'جنيه مصري',
            'SAR' => 'ريال سعودي',
            'USD' => 'دولار أمريكي',
            'EUR' => 'يورو',
            'AED' => 'درهم إماراتي',
            'KWD' => 'دينار كويتي',
        ];

        $amountInWords = $this->numberToArabicWords($invoice->amount);
        $currencyName = $currencyNames[$invoice->currency] ?? $invoice->currency;

        $pdf = Pdf::loadView('invoices.arabic-invoice', [
            'invoice' => $invoice,
            'contract' => $invoice->contract,
            'client' => $invoice->contract?->client,
            'company' => $invoice->company,
            'payments' => $invoice->payments,
            'paidAmount' => $invoice->payments->sum('amount'),
            'statusLabels' => $statusLabels,
            'primaryColor' => $invoice->company?->primary_color ?? '#2563eb',
            'currencyName' => $currencyName,
            'amountInWords' => $amountInWords,
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('isRemoteEnabled', true);
        $pdf->setOption('chroot', [storage_path('fonts'), public_path()]);

        $filename = 'invoice-' . str_pad($invoice->id, 5, '0', STR_PAD_LEFT) . '.pdf';
        return $pdf->download($filename);
    }

    private function numberToArabicWords(float $number): string
    {
        $ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
        $teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
        $tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
        $hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

        $integer = (int) $number;
        $decimal = (int) round(($number - $integer) * 100);

        if ($integer === 0) return 'صفر';

        $result = '';

        if ($integer >= 1000000) {
            $millions = (int) ($integer / 1000000);
            $result .= $this->convertChunk($millions, $ones, $teens, $tens, $hundreds) . ' مليون';
            $integer %= 1000000;
            if ($integer > 0) $result .= ' و';
        }

        if ($integer >= 1000) {
            $thousands = (int) ($integer / 1000);
            if ($thousands === 1) $result .= 'ألف';
            elseif ($thousands === 2) $result .= 'ألفان';
            else $result .= $this->convertChunk($thousands, $ones, $teens, $tens, $hundreds) . ' آلاف';
            $integer %= 1000;
            if ($integer > 0) $result .= ' و';
        }

        if ($integer > 0) {
            $result .= $this->convertChunk($integer, $ones, $teens, $tens, $hundreds);
        }

        if ($decimal > 0) {
            $result .= ' و' . $this->convertChunk($decimal, $ones, $teens, $tens, $hundreds) . ' قرش';
        }

        return $result;
    }

    private function convertChunk(int $num, array $ones, array $teens, array $tens, array $hundreds): string
    {
        $parts = [];

        if ($num >= 100) {
            $parts[] = $hundreds[(int) ($num / 100)];
            $num %= 100;
        }

        if ($num >= 10 && $num < 20) {
            $parts[] = $teens[$num - 10];
        } elseif ($num >= 20) {
            $unit = $num % 10;
            if ($unit > 0) $parts[] = $ones[$unit] . ' و' . $tens[(int) ($num / 10)];
            else $parts[] = $tens[(int) ($num / 10)];
        } elseif ($num > 0) {
            $parts[] = $ones[$num];
        }

        return implode(' و', $parts);
    }
}
