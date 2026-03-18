<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @font-face {
            font-family: 'Cairo';
            src: url('{{ storage_path("fonts/Cairo-Regular.ttf") }}');
            font-weight: normal;
        }
        @font-face {
            font-family: 'Cairo';
            src: url('{{ storage_path("fonts/Cairo-Bold.ttf") }}');
            font-weight: bold;
        }

        * {
            font-family: 'Cairo', 'DejaVu Sans', sans-serif;
            direction: rtl;
            text-align: right;
        }

        body {
            margin: 0;
            padding: 30px;
            background: #fff;
            color: #1a1a2e;
            font-size: 13px;
        }

        /* ── Header ── */
        .invoice-header {
            display: table;
            width: 100%;
            border-bottom: 3px solid {{ $primaryColor ?? '#2563eb' }};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header-right { display: table-cell; width: 50%; text-align: right; vertical-align: top; }
        .header-left  { display: table-cell; width: 50%; text-align: left; vertical-align: top; }

        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: {{ $primaryColor ?? '#2563eb' }};
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #1a1a2e;
            text-align: left;
        }
        .invoice-number {
            font-size: 14px;
            color: #6b7280;
            text-align: left;
        }

        /* ── Parties ── */
        .parties {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .party-box {
            display: table-cell;
            width: 48%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            vertical-align: top;
        }
        .party-spacer { display: table-cell; width: 4%; }
        .party-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .party-name {
            font-size: 15px;
            font-weight: bold;
            color: #1a1a2e;
        }
        .party-detail {
            font-size: 12px;
            color: #4b5563;
            margin-top: 3px;
        }

        /* ── Dates Row ── */
        .dates-row {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }
        .date-cell {
            display: table-cell;
            width: 33%;
            text-align: center;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 10px;
        }
        .date-spacer { display: table-cell; width: 0.5%; }
        .date-label { font-size: 11px; color: #3b82f6; }
        .date-value { font-size: 13px; font-weight: bold; color: #1e40af; }

        /* ── Items Table ── */
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.items thead tr {
            background: {{ $primaryColor ?? '#2563eb' }};
            color: white;
        }
        table.items thead th {
            padding: 10px 12px;
            font-size: 12px;
            font-weight: bold;
            text-align: right;
        }
        table.items thead th.num { text-align: left; }
        table.items tbody tr:nth-child(even) { background: #f8fafc; }
        table.items tbody tr:nth-child(odd)  { background: #ffffff; }
        table.items tbody td {
            padding: 10px 12px;
            font-size: 12px;
            border-bottom: 1px solid #e5e7eb;
            text-align: right;
        }
        table.items tbody td.num {
            text-align: left;
        }

        /* ── Totals ── */
        .totals-wrapper {
            display: table;
            width: 100%;
        }
        .totals-notes { display: table-cell; width: 55%; vertical-align: top; }
        .totals-spacer { display: table-cell; width: 5%; }
        .totals-box {
            display: table-cell;
            width: 40%;
            vertical-align: top;
        }
        .total-row {
            display: table;
            width: 100%;
            padding: 7px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .total-label {
            display: table-cell;
            text-align: right;
            color: #6b7280;
            font-size: 12px;
        }
        .total-value {
            display: table-cell;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
            color: #1a1a2e;
        }
        .total-final {
            display: table;
            width: 100%;
            background: {{ $primaryColor ?? '#2563eb' }};
            border-radius: 8px;
            padding: 12px;
            margin-top: 10px;
        }
        .total-final .label {
            display: table-cell;
            color: white;
            font-size: 14px;
            font-weight: bold;
        }
        .total-final .value {
            display: table-cell;
            color: white;
            font-size: 16px;
            font-weight: bold;
            text-align: left;
        }

        /* ── Status Badge ── */
        .status-badge {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-paid     { background: #d1fae5; color: #065f46; }
        .status-pending  { background: #dbeafe; color: #1e40af; }
        .status-overdue  { background: #fee2e2; color: #991b1b; }
        .status-partial  { background: #fef3c7; color: #92400e; }

        /* ── Payments History ── */
        .payments-section {
            margin-top: 25px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .payments-title {
            background: #f1f5f9;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 13px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
        }

        /* ── Amount in words ── */
        .amount-words {
            background: #fefce8;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 10px 15px;
            font-size: 12px;
            color: #92400e;
            margin-bottom: 20px;
        }

        /* ── Footer ── */
        .invoice-footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
        }
    </style>
</head>
<body>

{{-- ═══ HEADER ═══ --}}
<div class="invoice-header">
    <div class="header-right">
        @if($company->logo)
            <img src="{{ storage_path('app/public/' . $company->logo) }}"
                 height="50" style="margin-bottom:8px;"><br>
        @endif
        <div class="company-name">{{ $company->name }}</div>
    </div>
    <div class="header-left">
        <div class="invoice-title">فاتورة</div>
        <div class="invoice-number">رقم: #{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</div>
        <div style="margin-top:8px;">
            <span class="status-badge status-{{ $invoice->status }}">
                {{ $statusLabels[$invoice->status] ?? $invoice->status }}
            </span>
        </div>
    </div>
</div>

{{-- ═══ PARTIES ═══ --}}
<div class="parties">
    <div class="party-box">
        <div class="party-label">من</div>
        <div class="party-name">{{ $company->name }}</div>
    </div>

    <div class="party-spacer"></div>

    <div class="party-box">
        <div class="party-label">فاتورة إلى</div>
        <div class="party-name">{{ $client->name }}</div>
        @if($client->company_name)<div class="party-detail">{{ $client->company_name }}</div>@endif
        @if($client->phone)<div class="party-detail">{{ $client->phone }}</div>@endif
    </div>
</div>

{{-- ═══ DATES ═══ --}}
<div class="dates-row">
    <div class="date-cell">
        <div class="date-label">تاريخ الإصدار</div>
        <div class="date-value">{{ $invoice->created_at->format('d/m/Y') }}</div>
    </div>
    <div class="date-spacer"></div>
    <div class="date-cell">
        <div class="date-label">تاريخ الاستحقاق</div>
        <div class="date-value">{{ $invoice->due_date->format('d/m/Y') }}</div>
    </div>
    <div class="date-spacer"></div>
    <div class="date-cell">
        <div class="date-label">نوع الخدمة</div>
        <div class="date-value">{{ $client->service ?? 'خدمات' }}</div>
    </div>
</div>

{{-- ═══ ITEMS TABLE ═══ --}}
<table class="items">
    <thead>
        <tr>
            <th style="width:5%">#</th>
            <th style="width:50%">الخدمة / البيان</th>
            <th class="num" style="width:20%">السعر</th>
            <th class="num" style="width:25%">الإجمالي</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>1</td>
            <td>
                @if($contract)
                    عقد: {{ $client->name }}
                    <br><span style="color:#6b7280; font-size:11px;">
                        {{ $contract->payment_type === 'monthly' ? 'اشتراك شهري' : 'أقساط' }}
                        | من {{ $contract->start_date->format('d/m/Y') }}
                        @if($contract->end_date) إلى {{ $contract->end_date->format('d/m/Y') }} @endif
                    </span>
                @else
                    خدمات {{ $client->service ?? '' }}
                @endif
            </td>
            <td class="num">{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</td>
            <td class="num">{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</td>
        </tr>
    </tbody>
</table>

{{-- ═══ AMOUNT IN WORDS ═══ --}}
<div class="amount-words">
    المبلغ كتابة:
    <strong>{{ $amountInWords }} {{ $currencyName }}</strong>
</div>

{{-- ═══ TOTALS + NOTES ═══ --}}
<div class="totals-wrapper">
    <div class="totals-notes">
        @if($invoice->notes ?? false)
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px;">
            <div style="font-weight:bold; margin-bottom:5px; font-size:12px;">ملاحظات:</div>
            <div style="color:#6b7280; font-size:12px;">{{ $invoice->notes }}</div>
        </div>
        @endif
    </div>

    <div class="totals-spacer"></div>

    <div class="totals-box">
        <div class="total-row">
            <span class="total-label">المجموع</span>
            <span class="total-value">{{ number_format($invoice->amount, 2) }} {{ $invoice->currency }}</span>
        </div>
        <div class="total-row">
            <span class="total-label">المدفوع</span>
            <span class="total-value" style="color:#16a34a;">
                {{ number_format($paidAmount, 2) }} {{ $invoice->currency }}
            </span>
        </div>
        <div class="total-final">
            <span class="label">المتبقي</span>
            <span class="value">
                {{ number_format($invoice->amount - $paidAmount, 2) }}
                {{ $invoice->currency }}
            </span>
        </div>
    </div>
</div>

{{-- ═══ PAYMENTS HISTORY ═══ --}}
@if($payments->count() > 0)
<div class="payments-section">
    <div class="payments-title">سجل المدفوعات</div>
    <table class="items" style="margin-bottom:0;">
        <thead>
            <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th>ملاحظات</th>
                <th class="num">المبلغ المدفوع</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $i => $payment)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $payment->paid_at->format('d/m/Y') }}</td>
                <td>{{ $payment->notes ?? '—' }}</td>
                <td class="num" style="color:#16a34a; font-weight:bold;">
                    {{ number_format($payment->amount, 2) }} {{ $invoice->currency }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

{{-- ═══ FOOTER ═══ --}}
<div class="invoice-footer">
    <div>شكراً لثقتكم — {{ $company->name }}</div>
    <div style="margin-top:8px; font-size:10px; color:#d1d5db;">
        تم إنشاء هذه الفاتورة بواسطة ERPFlex | {{ now()->format('d/m/Y H:i') }}
    </div>
</div>

</body>
</html>
