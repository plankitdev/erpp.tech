<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => 'sometimes|string|max:255',
            'phone'        => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'sector'       => 'nullable|string|max:100',
            'service'      => 'nullable|string|max:100',
            'status'       => 'nullable|in:active,inactive,suspended',
            'notes'        => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'اسم العميل يجب ألا يتجاوز 255 حرف',
        ];
    }
}
