<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => 'required|string|max:255',
            'key'            => 'nullable|string|max:12',
            'description'    => 'nullable|string',
            'client_id'      => 'nullable|exists:clients,id',
            'status'         => 'sometimes|in:active,completed,on_hold,cancelled',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date|after_or_equal:start_date',
            'budget'         => 'nullable|numeric|min:0',
            'estimated_cost' => 'nullable|numeric|min:0',
            'currency'       => 'sometimes|in:EGP,USD,SAR',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'         => 'اسم المشروع مطلوب',
            'name.max'              => 'اسم المشروع يجب ألا يتجاوز 255 حرف',
            'client_id.exists'      => 'العميل المحدد غير موجود',
            'status.in'             => 'حالة المشروع غير صالحة',
            'end_date.after_or_equal' => 'تاريخ الانتهاء يجب أن يكون بعد أو يساوي تاريخ البداية',
            'budget.min'            => 'الميزانية يجب أن تكون 0 أو أكثر',
            'currency.in'           => 'العملة يجب أن تكون EGP أو USD أو SAR',
        ];
    }
}
