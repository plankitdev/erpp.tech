<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <title>عرض سعر {{ $quotation->reference }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; direction: rtl; color: #1f2937; padding: 40px; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .doc-title { font-size: 28px; font-weight: bold; color: #374151; text-align: left; }
        .doc-ref { font-size: 14px; color: #6b7280; text-align: left; }
        .info-grid { display: table; width: 100%; margin-bottom: 25px; }
        .info-box { display: table-cell; width: 50%; vertical-align: top; }
        .info-box h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
        .info-box p { margin-bottom: 3px; font-size: 13px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
        .status-draft { background: #F3F4F6; color: #374151; }
        .status-sent { background: #DBEAFE; color: #1E40AF; }
        .status-accepted { background: #D1FAE5; color: #065F46; }
        .status-rejected { background: #FEE2E2; color: #991B1B; }
        .status-expired { background: #FEF3C7; color: #92400E; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #F3F4F6; padding: 10px 14px; text-align: right; font-size: 12px; color: #374151; border-bottom: 2px solid #E5E7EB; }
        td { padding: 10px 14px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
        .amount-cell { text-align: left; font-weight: 600; }
        .totals { margin-top: 20px; }
        .totals table { width: 50%; margin-right: 0; margin-left: auto; }
        .totals td { padding: 8px 14px; }
        .totals tr:last-child { border-top: 2px solid #374151; }
        .totals tr:last-child td { font-weight: bold; font-size: 16px; color: #2563eb; }
        .section { margin-top: 25px; }
        .section h3 { font-size: 14px; color: #374151; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
        .section p { font-size: 13px; color: #4b5563; line-height: 1.6; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 11px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">{{ $company->name }}</div>
        </div>
        <div>
            <div class="doc-title">عرض سعر</div>
            <div class="doc-ref">{{ $quotation->reference }}</div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>بيانات العميل</h3>
            @if($quotation->client)
                <p><strong>{{ $quotation->client->name }}</strong></p>
                @if($quotation->client->company_name)<p>{{ $quotation->client->company_name }}</p>@endif
                @if($quotation->client->phone)<p>{{ $quotation->client->phone }}</p>@endif
            @elseif($quotation->lead)
                <p><strong>{{ $quotation->lead->name }}</strong></p>
                @if($quotation->lead->company_name)<p>{{ $quotation->lead->company_name }}</p>@endif
            @endif
        </div>
        <div class="info-box" style="text-align: left;">
            <h3>تفاصيل العرض</h3>
            <p>التاريخ: {{ $quotation->created_at->format('Y-m-d') }}</p>
            @if($quotation->valid_until)<p>صالح حتى: {{ $quotation->valid_until->format('Y-m-d') }}</p>@endif
            <p>الحالة: <span class="status-badge status-{{ $quotation->status }}">{{ $statusLabel }}</span></p>
        </div>
    </div>

    <h3 style="font-size: 16px; margin-bottom: 5px;">{{ $quotation->subject }}</h3>
    @if($quotation->description)
        <p style="color: #6b7280; margin-bottom: 15px;">{{ $quotation->description }}</p>
    @endif

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th class="amount-cell">الإجمالي</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quotation->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item['description'] }}</td>
                    <td>{{ $item['quantity'] }}</td>
                    <td>{{ number_format($item['unit_price'], 2) }} {{ $quotation->currency }}</td>
                    <td class="amount-cell">{{ number_format($item['quantity'] * $item['unit_price'], 2) }} {{ $quotation->currency }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>المجموع الفرعي</td>
                <td class="amount-cell">{{ number_format($quotation->subtotal, 2) }} {{ $quotation->currency }}</td>
            </tr>
            @if($quotation->discount > 0)
                <tr>
                    <td>الخصم</td>
                    <td class="amount-cell" style="color: #ef4444;">-{{ number_format($quotation->discount, 2) }} {{ $quotation->currency }}</td>
                </tr>
            @endif
            @if($quotation->tax_rate > 0)
                <tr>
                    <td>الضريبة ({{ $quotation->tax_rate }}%)</td>
                    <td class="amount-cell">{{ number_format($quotation->tax_amount, 2) }} {{ $quotation->currency }}</td>
                </tr>
            @endif
            <tr>
                <td>الإجمالي</td>
                <td class="amount-cell">{{ number_format($quotation->total, 2) }} {{ $quotation->currency }}</td>
            </tr>
        </table>
    </div>

    @if($quotation->terms)
        <div class="section">
            <h3>الشروط والأحكام</h3>
            <p>{!! nl2br(e($quotation->terms)) !!}</p>
        </div>
    @endif

    @if($quotation->notes)
        <div class="section">
            <h3>ملاحظات</h3>
            <p>{!! nl2br(e($quotation->notes)) !!}</p>
        </div>
    @endif

    <div class="footer">
        <p>{{ $company->name }} — تم إنشاء هذا العرض بواسطة ERPFlex</p>
    </div>
</body>
</html>
