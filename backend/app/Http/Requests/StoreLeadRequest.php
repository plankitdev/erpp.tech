<?php

namespace App\Http\Requests;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => 'required|string|max:255',
            'phone'            => 'nullable|string|max:30',
            'email'            => 'nullable|email|max:255',
            'source'           => 'required|in:' . implode(',', Lead::SOURCES),
            'service_type'     => 'required|in:' . implode(',', Lead::SERVICE_TYPES),
            'expected_budget'  => 'nullable|numeric|min:0',
            'stage'            => 'sometimes|in:' . implode(',', Lead::STAGES),
            'first_contact_date' => 'nullable|date',
            'notes'            => 'nullable|string|max:2000',
            'proposed_amount'  => 'nullable|numeric|min:0',
            'final_amount'     => 'nullable|numeric|min:0',
            'assigned_to'      => 'nullable|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'         => 'اسم العميل المحتمل مطلوب',
            'source.required'       => 'مصدر العميل مطلوب',
            'service_type.required' => 'نوع الخدمة مطلوب',
        ];
    }
}
