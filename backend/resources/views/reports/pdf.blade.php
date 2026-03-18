<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @font-face { font-family: 'Cairo'; src: url('{{ storage_path("fonts/Cairo-Regular.ttf") }}'); }
        body { font-family: 'Cairo', 'DejaVu Sans', sans-serif; direction: rtl; text-align: right; font-size: 12px; color: #333; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
        .header h1 { font-size: 20px; color: #1e40af; margin: 0; }
        .header .company { font-size: 14px; color: #666; margin-top: 5px; }
        .header .date { font-size: 11px; color: #999; margin-top: 5px; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 25px; }
        .summary-item { text-align: center; padding: 10px 20px; background: #f8fafc; border-radius: 8px; }
        .summary-item .label { font-size: 10px; color: #666; }
        .summary-item .value { font-size: 16px; font-weight: bold; color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #3b82f6; color: white; padding: 8px 12px; font-size: 11px; }
        td { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        @if($company)
            <div class="company">{{ $company->name }}</div>
        @endif
        <h1>{{ $title }}</h1>
        <div class="date">{{ $year }} @if($type === 'monthly') - شهر {{ $month }} @endif | العملة: {{ $currency }}</div>
    </div>

    @if(isset($data['summary']))
        <table>
            <tr>
                @foreach($data['summary'] as $label => $value)
                    <td style="text-align:center; border:none; background:#f0f9ff; padding:12px;">
                        <div style="font-size:10px;color:#666;">{{ $label }}</div>
                        <div style="font-size:16px;font-weight:bold;color:#1e40af;">{{ number_format($value, 2) }}</div>
                    </td>
                @endforeach
            </tr>
        </table>
        <br>
    @endif

    @if(isset($data['table_data']) && isset($data['table_headers']))
        <table>
            <thead>
                <tr>
                    @foreach($data['table_headers'] as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($data['table_data'] as $row)
                    <tr>
                        @foreach($data['table_headers'] as $header)
                            <td>{{ is_numeric($row[$header] ?? '') ? number_format($row[$header], 2) : ($row[$header] ?? '-') }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if(isset($data['monthly']) && $type === 'profit-loss')
        <table>
            <thead>
                <tr>
                    <th>الشهر</th><th>الإيرادات</th><th>المصروفات التشغيلية</th><th>الرواتب</th><th>إجمالي المصروفات</th><th>صافي الربح</th><th>الهامش</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['monthly'] as $m)
                <tr>
                    <td>{{ $m['month_name'] }}</td>
                    <td>{{ number_format($m['revenue'], 2) }}</td>
                    <td>{{ number_format($m['operating_expenses'], 2) }}</td>
                    <td>{{ number_format($m['salaries'], 2) }}</td>
                    <td>{{ number_format($m['total_expenses'], 2) }}</td>
                    <td style="color:{{ $m['net_profit'] >= 0 ? '#059669' : '#dc2626' }}">{{ number_format($m['net_profit'], 2) }}</td>
                    <td>{{ $m['margin'] }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if(isset($data['monthly']) && $type === 'cash-flow')
        <table>
            <thead>
                <tr>
                    <th>الشهر</th><th>النقد الوارد</th><th>النقد الصادر</th><th>صافي التدفق</th><th>الرصيد التراكمي</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['monthly'] as $m)
                <tr>
                    <td>{{ $m['month_name'] }}</td>
                    <td>{{ number_format($m['cash_in'], 2) }}</td>
                    <td>{{ number_format($m['cash_out'], 2) }}</td>
                    <td style="color:{{ $m['net_flow'] >= 0 ? '#059669' : '#dc2626' }}">{{ number_format($m['net_flow'], 2) }}</td>
                    <td>{{ number_format($m['cumulative_balance'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if(isset($data['chart_data']) && $type === 'yearly')
        <table>
            <thead>
                <tr><th>الشهر</th><th>الإيرادات</th><th>المصروفات</th><th>الربح</th></tr>
            </thead>
            <tbody>
                @foreach($data['chart_data'] as $cd)
                <tr>
                    <td>{{ $cd['label'] }}</td>
                    <td>{{ number_format($cd['revenue'], 2) }}</td>
                    <td>{{ number_format($cd['expenses'], 2) }}</td>
                    <td style="color:{{ $cd['profit'] >= 0 ? '#059669' : '#dc2626' }}">{{ number_format($cd['profit'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        تم إنشاء هذا التقرير بواسطة ERPFlex &bull; {{ now()->format('Y-m-d H:i') }}
    </div>
</body>
</html>
