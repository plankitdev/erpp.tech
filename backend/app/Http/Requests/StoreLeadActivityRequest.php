<?php

namespace App\Http\Requests;

use App\Models\LeadActivity;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeadActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'               => 'required|in:' . implode(',', LeadActivity::TYPES),
            'notes'              => 'nullable|string|max:2000',
            'outcome'            => 'nullable|in:' . implode(',', LeadActivity::OUTCOMES),
            'next_followup_date' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'نوع النشاط مطلوب',
        ];
    }
}
