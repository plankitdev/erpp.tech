<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'required|string|max:255',
            'slug'            => 'nullable|string|max:255|unique:clients,slug',
            'phone'           => 'nullable|string|max:20',
            'company_name'    => 'nullable|string|max:255',
            'sector'          => 'nullable|string|max:100',
            'service'         => 'nullable|string|max:100',
            'monthly_payment' => 'nullable|numeric|min:0',
            'payment_day'     => 'nullable|integer|min:1|max:28',
            'status'          => 'nullable|in:active,inactive,suspended',
            'notes'           => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم العميل مطلوب',
            'name.max'      => 'اسم العميل يجب ألا يتجاوز 255 حرف',
        ];
    }
}
