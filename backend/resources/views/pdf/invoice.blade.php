<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <title>فاتورة #{{ $invoice->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; direction: rtl; color: #1f2937; padding: 40px; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid {{ $primaryColor ?? '#2563eb' }}; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; color: {{ $primaryColor ?? '#2563eb' }}; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #374151; text-align: left; }
        .invoice-number { font-size: 14px; color: #6b7280; text-align: left; }
        .info-grid { display: table; width: 100%; margin-bottom: 25px; }
        .info-box { display: table-cell; width: 50%; vertical-align: top; }
        .info-box h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
        .info-box p { margin-bottom: 3px; font-size: 13px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
        .status-pending { background: #FEF3C7; color: #92400E; }
        .status-paid { background: #D1FAE5; color: #065F46; }
        .status-overdue { background: #FEE2E2; color: #991B1B; }
        .status-partial { background: #DBEAFE; color: #1E40AF; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #F3F4F6; padding: 10px 14px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #E5E7EB; }
        td { padding: 10px 14px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
        .amount-cell { text-align: left; font-weight: 600; }
        .totals { margin-top: 20px; }
        .totals table { width: 50%; margin-right: 0; margin-left: auto; }
        .totals td { padding: 8px 14px; }
        .totals tr:last-child { border-top: 2px solid #374151; }
        .totals tr:last-child td { font-weight: bold; font-size: 16px; color: {{ $primaryColor ?? '#2563eb' }}; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">{{ $company->name }}</div>
        </div>
        <div>
            <div class="invoice-title">فاتورة</div>
            <div class="invoice-number">#{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>بيانات العميل</h3>
            <p><strong>{{ $client->name }}</strong></p>
            @if($client->company_name)<p>{{ $client->company_name }}</p>@endif
            @if($client->phone)<p>{{ $client->phone }}</p>@endif
        </div>
        <div class="info-box" style="text-align: left;">
            <h3>بيانات الفاتورة</h3>
            <p>التاريخ: {{ $invoice->created_at->format('Y-m-d') }}</p>
            <p>تاريخ الاستحقاق: {{ $invoice->due_date->format('Y-m-d') }}</p>
            <p>الحالة: <span class="status-badge status-{{ $invoice->status }}">{{ $statusLabel }}</span></p>
        </div>
    </div>

    @if($contract)
    <table>
        <thead>
            <tr>
                <th>الوصف</th>
                <th>العملة</th>
                <th style="text-align: left;">المبلغ</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>عقد: {{ $contract->client->name ?? '' }}</strong><br>
                    <span style="color: #6b7280;">
                        {{ $contract->payment_type === 'monthly' ? 'اشتراك شهري' : 'أقساط' }}
                        | من {{ $contract->start_date->format('Y-m-d') }}
                        @if($contract->end_date) إلى {{ $contract->end_date->format('Y-m-d') }} @endif
                    </span>
                </td>
                <td>{{ $invoice->currency }}</td>
                <td class="amount-cell">{{ number_format($invoice->amount, 2) }}</td>
            </tr>
        </tbody>
    </table>
    @endif

    <div class="totals">
        <table>
            <tr>
                <td>إجمالي الفاتورة</td>
                <td class="amount-cell">{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</td>
            </tr>
            <tr>
                <td>المدفوع</td>
                <td class="amount-cell">{{ number_format($paidAmount, 2) }} {{ $invoice->currency }}</td>
            </tr>
            <tr>
                <td>المتبقي</td>
                <td class="amount-cell">{{ number_format($invoice->amount - $paidAmount, 2) }} {{ $invoice->currency }}</td>
            </tr>
        </table>
    </div>

    @if($payments->count() > 0)
    <h3 style="margin-top: 30px; margin-bottom: 10px; font-size: 14px;">سجل المدفوعات</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th style="text-align: left;">المبلغ</th>
                <th>ملاحظات</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $i => $payment)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $payment->paid_at->format('Y-m-d') }}</td>
                <td class="amount-cell">{{ number_format($payment->amount, 2) }} {{ $invoice->currency }}</td>
                <td>{{ $payment->notes ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        <p>تم إنشاء هذه الفاتورة بواسطة نظام ERPFlex | {{ now()->format('Y-m-d H:i') }}</p>
    </div>
</body>
</html>
