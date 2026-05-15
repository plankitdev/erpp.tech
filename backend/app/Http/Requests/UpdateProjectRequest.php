<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'client_id'      => 'nullable|exists:clients,id',
            'status'         => 'sometimes|in:active,completed,on_hold,cancelled',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date',
            'budget'         => 'nullable|numeric|min:0',
            'estimated_cost' => 'nullable|numeric|min:0',
            'currency'       => 'sometimes|in:EGP,USD,SAR',
        ];
    }

    public function messages(): array
    {
        return [
            'name.max'         => 'اسم المشروع يجب ألا يتجاوز 255 حرف',
            'client_id.exists' => 'العميل المحدد غير موجود',
            'status.in'        => 'حالة المشروع غير صالحة',
            'budget.min'       => 'الميزانية يجب أن تكون 0 أو أكثر',
            'currency.in'      => 'العملة يجب أن تكون EGP أو USD أو SAR',
        ];
    }
}
