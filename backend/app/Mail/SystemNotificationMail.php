<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SystemNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $companyName;
    public ?string $recipientName;
    public ?string $actionUrl;

    public function __construct(public Notification $notification, ?string $companyName = null, ?string $recipientName = null)
    {
        $this->companyName = $companyName ?: config('app.name', 'ERPP');
        $this->recipientName = $recipientName;

        // Build an absolute link into the app (SPA route) when the notification
        // carries one, so the email's button lands the user on the right page.
        $link = $notification->link;
        if ($link) {
            $this->actionUrl = str_starts_with($link, 'http')
                ? $link
                : rtrim(config('app.frontend_url', config('app.url')), '/') . '/' . ltrim($link, '/');
        } else {
            $this->actionUrl = null;
        }
    }

    /**
     * Per-type visual identity: [accent color, light tint, emoji icon, CTA label].
     * Every notification category gets its own colour + icon + button wording so
     * the email reads at a glance instead of one generic purple template.
     */
    protected function theme(): array
    {
        $map = [
            Notification::TYPE_TASK_ASSIGNED    => ['#4f46e5', '#eef2ff', '📋', 'عرض المهمة'],
            Notification::TYPE_TASK_IN_REVIEW   => ['#7c3aed', '#f5f3ff', '👀', 'مراجعة المهمة'],
            Notification::TYPE_TASK_COMPLETED   => ['#059669', '#ecfdf5', '✅', 'عرض المهمة'],
            Notification::TYPE_TASK_REJECTED    => ['#dc2626', '#fef2f2', '↩️', 'عرض المهمة'],
            Notification::TYPE_TASK_OVERDUE     => ['#dc2626', '#fef2f2', '⏰', 'عرض المهمة'],
            Notification::TYPE_CHAT_MENTION     => ['#4f46e5', '#eef2ff', '💬', 'عرض التعليق'],
            Notification::TYPE_SALARY_PAID      => ['#059669', '#ecfdf5', '💰', 'عرض التفاصيل'],
            Notification::TYPE_PAYMENT_RECEIVED => ['#059669', '#ecfdf5', '💵', 'عرض الفاتورة'],
            Notification::TYPE_EXPENSE_CREATED  => ['#d97706', '#fffbeb', '🧾', 'عرض المصروف'],
            Notification::TYPE_INVOICE_OVERDUE  => ['#dc2626', '#fef2f2', '⚠️', 'عرض الفاتورة'],
            Notification::TYPE_CONTRACT_EXPIRING => ['#d97706', '#fffbeb', '📄', 'عرض العقد'],
            Notification::TYPE_MEETING_REMINDER => ['#7c3aed', '#f5f3ff', '📅', 'عرض الاجتماع'],
            Notification::TYPE_PROJECT_CREATED  => ['#7c3aed', '#f5f3ff', '📁', 'عرض المشروع'],
            Notification::TYPE_LEAD_NEW         => ['#0d9488', '#f0fdfa', '🎯', 'عرض العميل المحتمل'],
            Notification::TYPE_LEAD_WON         => ['#059669', '#ecfdf5', '🏆', 'عرض العميل'],
            Notification::TYPE_FILE_SENT        => ['#7c3aed', '#f5f3ff', '📎', 'عرض الملف'],
        ];
        [$color, $bg, $icon, $cta] = $map[$this->notification->type] ?? ['#4f46e5', '#eef2ff', '🔔', 'فتح في النظام'];

        return ['color' => $color, 'bg' => $bg, 'icon' => $icon, 'cta' => $cta];
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->notification->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.notification',
            with: [
                'title'         => $this->notification->title,
                'body'          => $this->notification->body,
                'actionUrl'     => $this->actionUrl,
                'companyName'   => $this->companyName,
                'recipientName' => $this->recipientName,
                'theme'         => $this->theme(),
                'preheader'     => $this->notification->body ?: $this->notification->title,
            ],
        );
    }
}
