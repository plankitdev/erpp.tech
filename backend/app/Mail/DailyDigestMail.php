<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyDigestMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public array $stats;
    public string $date;

    public function __construct(User $user, array $stats)
    {
        $this->user = $user;
        $this->stats = $stats;
        $this->date = now()->format('Y-m-d');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "التقرير اليومي التلقائي - {$this->date}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.daily_digest',
        );
    }
}
