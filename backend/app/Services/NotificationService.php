<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public static function notify(int $companyId, int $userId, string $type, string $title, ?string $body = null, ?string $link = null): Notification
    {
        return Notification::create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);
    }

    public static function notifyRoles(int $companyId, array $roles, string $type, string $title, ?string $body = null, ?string $link = null): int
    {
        $users = User::where('company_id', $companyId)
            ->whereIn('role', $roles)
            ->pluck('id');

        foreach ($users as $userId) {
            self::notify($companyId, $userId, $type, $title, $body, $link);
        }

        return $users->count();
    }

    public static function chatMention(int $companyId, int $userId, string $mentionedBy, string $channelName, ?string $link = null): Notification
    {
        return self::notify(
            $companyId,
            $userId,
            Notification::TYPE_CHAT_MENTION,
            'تمت الإشارة إليك في محادثة',
            "{$mentionedBy} أشار إليك في {$channelName}",
            $link
        );
    }

    public static function taskAssigned(int $companyId, int $userId, string $taskTitle, ?string $link = null): Notification
    {
        return self::notify($companyId, $userId, Notification::TYPE_TASK_ASSIGNED, 'تم تكليفك بمهمة جديدة', "المهمة: {$taskTitle}", $link ?? '/tasks/board');
    }

    public static function taskCompleted(int $companyId, int $managerId, string $taskTitle, string $completedBy): Notification
    {
        return self::notify($companyId, $managerId, Notification::TYPE_TASK_COMPLETED, 'تم إنجاز مهمة', "{$completedBy} أنجز المهمة \"{$taskTitle}\"", '/tasks/board');
    }

    public static function leadCreated(int $companyId, string $leadName): int
    {
        return self::notifyRoles($companyId, ['super_admin', 'sales'], Notification::TYPE_LEAD_NEW, 'عميل محتمل جديد', "تم إضافة عميل محتمل: {$leadName}", '/leads');
    }

    public static function leadWon(int $companyId, string $leadName, string $value): int
    {
        return self::notifyRoles($companyId, ['super_admin', 'manager', 'sales'], Notification::TYPE_LEAD_WON, 'تم كسب فرصة بيع!', "العميل {$leadName} - القيمة: {$value}", '/leads');
    }

    public static function projectCreated(int $companyId, string $projectName, string $link): int
    {
        return self::notifyRoles($companyId, ['super_admin', 'manager'], Notification::TYPE_PROJECT_CREATED, 'مشروع جديد', "تم إنشاء مشروع: {$projectName}", $link);
    }

    public static function expenseCreated(int $companyId, string $category, string $amount): int
    {
        return self::notifyRoles($companyId, ['super_admin', 'accountant'], Notification::TYPE_EXPENSE_CREATED, 'مصروف جديد', "مصروف {$category} بمبلغ {$amount}", '/expenses');
    }

    public static function paymentReceived(int $companyId, string $clientName, string $amount): int
    {
        return self::notifyRoles($companyId, ['super_admin', 'accountant'], Notification::TYPE_PAYMENT_RECEIVED, 'تم استلام دفعة', "دفعة من {$clientName} بمبلغ {$amount}", '/invoices');
    }

    public static function meetingScheduled(int $companyId, int $userId, string $meetingTitle, string $startTime): Notification
    {
        return self::notify($companyId, $userId, Notification::TYPE_MEETING_REMINDER, 'اجتماع جديد', "تمت دعوتك لاجتماع: {$meetingTitle} في {$startTime}", '/meetings');
    }
}
