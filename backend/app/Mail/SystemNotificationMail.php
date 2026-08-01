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
    public ?string $actionUrl;

    public function __construct(public Notification $notification, ?string $companyName = null)
    {
        $this->companyName = $companyName ?: config('app.name', 'ERPP');

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
                'title'       => $this->notification->title,
                'body'        => $this->notification->body,
                'actionUrl'   => $this->actionUrl,
                'companyName' => $this->companyName,
            ],
        );
    }
}
