<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Tahoma, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-top: 5px solid #0d9488; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
        .header h1 { margin: 0; color: #0f766e; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section h2 { font-size: 18px; color: #334155; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .card { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
        .card span { display: block; font-size: 12px; color: #64748b; }
        .card strong { display: block; font-size: 20px; color: #0f766e; margin-top: 5px; }
        .list { list-style: none; padding: 0; margin: 0; }
        .list li { padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px; font-size: 14px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-right: 8px; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-success { background: #d1fae5; color: #047857; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
        .btn { display: inline-block; padding: 10px 20px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>التقرير اليومي التلقائي</h1>
            <p>مرحباً {{ $user->name }}، إليك ملخص نشاطات اليوم ({{ $date }})</p>
        </div>

        <!-- أرقام سريعة -->
        <div class="section">
            <h2>📊 أرقام سريعة</h2>
            <div class="card-grid">
                <div class="card">
                    <span>مهام مكتملة اليوم</span>
                    <strong>{{ $stats['tasks_completed_today'] }}</strong>
                </div>
                <div class="card">
                    <span>إيرادات اليوم (EGP)</span>
                    <strong>{{ number_format($stats['revenue_today']) }}</strong>
                </div>
                <div class="card">
                    <span>مهام متأخرة</span>
                    <strong style="color: #b91c1c;">{{ $stats['overdue_tasks_count'] }}</strong>
                </div>
                <div class="card">
                    <span>اجتماعات اليوم</span>
                    <strong>{{ $stats['meetings_today_count'] }}</strong>
                </div>
            </div>
        </div>

        <!-- مهام متأخرة -->
        @if(count($stats['overdue_tasks']) > 0)
        <div class="section">
            <h2>🔴 مهام متأخرة تحتاج اهتمام</h2>
            <ul class="list">
                @foreach($stats['overdue_tasks'] as $task)
                <li>
                    <span class="badge badge-danger">متأخرة</span>
                    <strong>{{ $task->title }}</strong> - 
                    <span style="color: #64748b;">مكلف بها: {{ $task->assignedUser->name ?? 'غير محدد' }}</span>
                </li>
                @endforeach
            </ul>
        </div>
        @endif

        <!-- اجتماعات اليوم -->
        @if(count($stats['meetings_today']) > 0)
        <div class="section">
            <h2>📅 اجتماعات اليوم</h2>
            <ul class="list">
                @foreach($stats['meetings_today'] as $meeting)
                <li>
                    <span class="badge badge-warning">{{ \Carbon\Carbon::parse($meeting->start_time)->format('h:i A') }}</span>
                    <strong>{{ $meeting->title }}</strong>
                </li>
                @endforeach
            </ul>
        </div>
        @endif

        <!-- روابط مفيدة -->
        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}" class="btn">الذهاب إلى لوحة التحكم</a>
        </div>

        <div class="footer">
            هذه رسالة تلقائية من نظام ERPFlex. يرجى عدم الرد عليها.
        </div>
    </div>
</body>
</html>
