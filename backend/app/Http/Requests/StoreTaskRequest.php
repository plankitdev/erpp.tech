<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                => 'required|string|max:255',
            'description'          => 'nullable|string',
            'assigned_to'          => 'nullable|exists:users,id',
            'priority'             => 'required|in:high,medium,low',
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
            'title.required'    => 'عنوان المهمة مطلوب',
            'title.max'         => 'عنوان المهمة يجب ألا يتجاوز 255 حرفاً',
            'priority.required' => 'الأولوية مطلوبة',
            'priority.in'       => 'الأولوية يجب أن تكون عالية أو متوسطة أو منخفضة',
            'status.in'         => 'الحالة غير صالحة',
            'due_date.date'     => 'تاريخ الاستحقاق غير صالح',
        ];
    }
}
