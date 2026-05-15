<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationStreamController extends Controller
{
    /**
     * Server-Sent Events stream for real-time notifications.
     *
     * The client sends the ID of the last notification it received via the
     * standard `Last-Event-ID` header. We only return notifications whose
     * primary-key id is greater than that value.
     *
     * The connection is held open for up to 30 seconds. After that the server
     * closes it and the browser's EventSource automatically reconnects.
     */
    public function stream(Request $request): StreamedResponse
    {
        $user    = $request->user();
        $lastId  = (int) $request->header('Last-Event-ID', $request->query('last_id', 0));
        $timeout = 30; // seconds before we close and let the client reconnect
        $poll    = 3;  // seconds between DB checks

        return response()->stream(function () use ($user, $lastId, $timeout, $poll) {
            $deadline = time() + $timeout;

            // Disable output buffering so data reaches the browser immediately.
            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            while (time() < $deadline) {
                // Send a comment-only keep-alive to prevent proxy timeouts.
                echo ": heartbeat\n\n";

                // Check for new notifications since the last one the client saw.
                $notifications = Notification::where('user_id', $user->id)
                    ->where('id', '>', $lastId)
                    ->orderBy('id')
                    ->get(['id', 'type', 'title', 'body', 'link', 'read_at', 'created_at']);

                foreach ($notifications as $n) {
                    $data = json_encode([
                        'id'         => $n->id,
                        'type'       => $n->type,
                        'title'      => $n->title,
                        'body'       => $n->body,
                        'link'       => $n->link,
                        'read_at'    => $n->read_at,
                        'created_at' => $n->created_at?->toISOString(),
                    ]);

                    echo "id: {$n->id}\n";
                    echo "event: notification\n";
                    echo "data: {$data}\n\n";

                    $lastId = $n->id;
                }

                flush();

                // Sleep in short increments so we can detect connection drops.
                for ($i = 0; $i < $poll * 10; $i++) {
                    if (connection_aborted()) {
                        return;
                    }
                    usleep(100_000); // 0.1 s
                }
            }

            // Signal a clean close so the browser reconnects immediately.
            echo "event: close\ndata: reconnect\n\n";
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream; charset=utf-8',
            'Cache-Control'     => 'no-cache, no-store',
            'X-Accel-Buffering' => 'no',   // Disable Nginx proxy buffering
            'Connection'        => 'keep-alive',
        ]);
    }
}
