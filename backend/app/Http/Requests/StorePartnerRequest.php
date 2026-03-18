<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => 'required|string|max:255',
            'phone'            => 'nullable|string|max:20',
            'bank_account'     => 'nullable|string|max:100',
            'share_percentage' => 'required|numeric|min:0|max:100',
            'capital'          => 'nullable|numeric|min:0',
            'is_active'        => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'اسم الشريك مطلوب',
            'share_percentage.required' => 'نسبة المشاركة مطلوبة',
            'share_percentage.min'      => 'نسبة المشاركة يجب أن تكون 0 على الأقل',
            'share_percentage.max'      => 'نسبة المشاركة يجب ألا تتجاوز 100',
        ];
    }
}
