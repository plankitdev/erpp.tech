<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>{{ $title }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Arial, sans-serif;">
    {{-- Hidden preheader (inbox preview snippet) --}}
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; height:0; width:0;">{{ $preheader }}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(15,23,42,0.08);">
                    {{-- Accent top bar (per-type colour) --}}
                    <tr><td style="height:5px; background:{{ $theme['color'] }}; font-size:0; line-height:0;">&nbsp;</td></tr>

                    {{-- Company name --}}
                    <tr>
                        <td style="padding:24px 32px 0;">
                            <span style="font-size:15px; font-weight:700; color:#0f172a;">{{ $companyName }}</span>
                        </td>
                    </tr>

                    {{-- Icon badge + title --}}
                    <tr>
                        <td style="padding:20px 32px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="width:48px; height:48px; background:{{ $theme['bg'] }}; border-radius:12px; text-align:center; font-size:24px; line-height:48px;">{{ $theme['icon'] }}</td>
                                    <td style="padding-right:14px;">
                                        <h1 style="margin:0; font-size:19px; font-weight:700; color:#0f172a; line-height:1.5;">{{ $title }}</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Greeting + body --}}
                    <tr>
                        <td style="padding:20px 32px 0;">
                            @if($recipientName)
                                <p style="margin:0 0 12px; font-size:15px; color:#334155;">مرحباً {{ $recipientName }}،</p>
                            @endif
                            @if($body)
                                <p style="margin:0; font-size:15px; color:#475569; line-height:1.9;">{{ $body }}</p>
                            @endif
                        </td>
                    </tr>

                    {{-- CTA button --}}
                    @if($actionUrl)
                        <tr>
                            <td style="padding:24px 32px 4px;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="border-radius:10px; background:{{ $theme['color'] }};">
                                            <a href="{{ $actionUrl }}" target="_blank"
                                               style="display:inline-block; padding:13px 30px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                                                {{ $theme['cta'] }} ←
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Divider --}}
                    <tr><td style="padding:24px 32px 0;"><div style="height:1px; background:#e2e8f0; font-size:0; line-height:0;">&nbsp;</div></td></tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:16px 32px 28px;">
                            <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.9;">
                                وصلك هذا الإيميل من نظام <strong style="color:#64748b;">{{ $companyName }}</strong> لأن لديك تحديث يخصّك.<br>
                                لإيقاف إشعارات البريد: الإعدادات ← الملف الشخصي.
                            </p>
                        </td>
                    </tr>
                </table>

                <p style="max-width:560px; margin:16px auto 0; font-size:11px; color:#cbd5e1; text-align:center;">© {{ $companyName }} — نظام إدارة متكامل</p>
            </td>
        </tr>
    </table>
</body>
</html>
