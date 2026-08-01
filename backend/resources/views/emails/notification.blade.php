<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#4f46e5,#4338ca); padding:28px 32px;">
                            <span style="color:#ffffff; font-size:18px; font-weight:700;">{{ $companyName }}</span>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 12px; font-size:20px; font-weight:700; color:#0f172a; line-height:1.5;">{{ $title }}</h1>

                            @if($body)
                                <p style="margin:0 0 24px; font-size:15px; color:#475569; line-height:1.8;">{{ $body }}</p>
                            @endif

                            @if($actionUrl)
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="border-radius:10px; background-color:#4f46e5;">
                                            <a href="{{ $actionUrl }}" target="_blank"
                                               style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                                                فتح في النظام
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            @endif
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0;">
                            <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.7;">
                                وصلك هذا الإيميل لأن لديك تحديث يخصّك على نظام {{ $companyName }}.<br>
                                يمكنك إيقاف إشعارات البريد من إعدادات حسابك ← الملف الشخصي.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
