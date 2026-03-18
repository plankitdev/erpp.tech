<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkflowLog;
use App\Models\WorkflowRule;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $rules = WorkflowRule::query()
            ->when($request->trigger, fn($q) => $q->where('trigger', $request->trigger))
            ->when($request->boolean('active_only'), fn($q) => $q->where('is_active', true))
            ->latest()
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($rules);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'trigger' => 'required|in:' . implode(',', WorkflowRule::TRIGGERS),
            'conditions' => 'nullable|array',
            'action' => 'required|in:' . implode(',', WorkflowRule::ACTIONS),
            'action_config' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $rule = WorkflowRule::create($data);

        return $this->successResponse($rule, 'تم إنشاء قاعدة الأتمتة بنجاح', 201);
    }

    public function show(WorkflowRule $workflow): JsonResponse
    {
        $workflow->load(['logs' => fn($q) => $q->latest()->limit(20)]);
        return $this->successResponse($workflow);
    }

    public function update(Request $request, WorkflowRule $workflow): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'trigger' => 'sometimes|in:' . implode(',', WorkflowRule::TRIGGERS),
            'conditions' => 'nullable|array',
            'action' => 'sometimes|in:' . implode(',', WorkflowRule::ACTIONS),
            'action_config' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $workflow->update($data);

        return $this->successResponse($workflow, 'تم تحديث قاعدة الأتمتة');
    }

    public function destroy(WorkflowRule $workflow): JsonResponse
    {
        $workflow->delete();
        return $this->successResponse(null, 'تم حذف القاعدة');
    }

    public function toggle(WorkflowRule $workflow): JsonResponse
    {
        $workflow->update(['is_active' => !$workflow->is_active]);
        $status = $workflow->is_active ? 'مفعّلة' : 'معطّلة';
        return $this->successResponse($workflow, "القاعدة الآن {$status}");
    }

    public function logs(Request $request): JsonResponse
    {
        $logs = WorkflowLog::with('rule:id,name')
            ->when($request->workflow_rule_id, fn($q) => $q->where('workflow_rule_id', $request->workflow_rule_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($logs);
    }

    public function templates(): JsonResponse
    {
        $templates = [
            [
                'name' => 'فاتورة نهائية عند انتهاء العقد',
                'trigger' => 'contract_expired',
                'conditions' => null,
                'action' => 'create_invoice',
                'action_config' => ['due_days' => 14],
            ],
            [
                'name' => 'إشعار قبل انتهاء العقد بأسبوع',
                'trigger' => 'contract_expiring',
                'conditions' => ['days_before' => 7],
                'action' => 'send_notification',
                'action_config' => [
                    'roles' => ['super_admin', 'manager', 'sales'],
                    'title' => 'عقد قارب على الانتهاء',
                    'body' => 'عقد العميل {client_name} ينتهي خلال {days} يوم',
                ],
            ],
            [
                'name' => 'مهمة متابعة عند تأخر فاتورة',
                'trigger' => 'invoice_overdue',
                'conditions' => null,
                'action' => 'create_task',
                'action_config' => [
                    'task_title' => 'متابعة فاتورة متأخرة',
                    'priority' => 'high',
                    'due_days' => 3,
                ],
            ],
            [
                'name' => 'إشعار عند إكمال مهمة',
                'trigger' => 'task_completed',
                'conditions' => null,
                'action' => 'send_notification',
                'action_config' => [
                    'roles' => ['super_admin', 'manager'],
                    'title' => 'تم إكمال مهمة',
                    'body' => 'تم إنجاز المهمة بنجاح',
                ],
            ],
            [
                'name' => 'إشعار عند تحويل عميل محتمل',
                'trigger' => 'lead_converted',
                'conditions' => null,
                'action' => 'send_notification',
                'action_config' => [
                    'roles' => ['super_admin', 'manager', 'accountant'],
                    'title' => 'تم تحويل عميل محتمل',
                    'body' => 'تم تحويل {client_name} إلى عميل وإنشاء عقد',
                ],
            ],
            [
                'name' => 'تحديث حالة العقد المنتهي',
                'trigger' => 'contract_expired',
                'conditions' => null,
                'action' => 'update_status',
                'action_config' => ['new_status' => 'completed'],
            ],
        ];

        return $this->successResponse($templates);
    }
}
