<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                => 'sometimes|string|max:255',
            'description'          => 'sometimes|string',
            'assigned_to'          => 'nullable|exists:users,id',
            'priority'             => 'sometimes|in:high,medium,low',
            'due_date'             => 'nullable|date',
            'client_id'            => 'nullable|exists:clients,id',
            'status'               => 'sometimes|in:todo,in_progress,review,done',
            'project_id'           => 'nullable|exists:projects,id',
            'parent_id'            => 'nullable|exists:tasks,id',
            'recurrence'           => 'sometimes|in:none,daily,weekly,monthly',
            'next_recurrence_date' => 'nullable|date',
            'assignee_ids'         => 'nullable|array',
            'assignee_ids.*'       => 'exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.max'     => 'عنوان المهمة يجب ألا يتجاوز 255 حرفاً',
            'priority.in'   => 'الأولوية يجب أن تكون عالية أو متوسطة أو منخفضة',
            'status.in'     => 'الحالة غير صالحة',
            'due_date.date' => 'تاريخ الاستحقاق غير صالح',
        ];
    }
}
