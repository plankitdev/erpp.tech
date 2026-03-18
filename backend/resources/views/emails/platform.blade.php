<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Cairo', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; }
        .body { padding: 24px; line-height: 1.8; color: #374151; font-size: 15px; }
        .footer { background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ERPFlex</h1>
        </div>
        <div class="body">
            {!! nl2br(e($emailBody)) !!}
        </div>
        <div class="footer">
            @if($senderName)
                <p>تم الإرسال بواسطة {{ $senderName }}</p>
            @endif
            <p>تم الإرسال من منصة ERPFlex — {{ config('app.url') }}</p>
        </div>
    </div>
</body>
</html>
