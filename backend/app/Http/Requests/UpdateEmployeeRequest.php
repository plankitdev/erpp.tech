<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => 'sometimes|string|max:255',
            'position'       => 'sometimes|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'national_id'    => 'nullable|string|max:50',
            'address'        => 'nullable|string|max:500',
            'bank_name'      => 'nullable|string|max:255',
            'bank_account'   => 'nullable|string|max:100',
            'base_salary'    => 'sometimes|numeric|min:0',
            'join_date'      => 'sometimes|date',
            'contract_start' => 'nullable|date',
            'contract_end'   => 'nullable|date|after_or_equal:contract_start',
            'notes'          => 'nullable|string',
            'user_id'        => 'nullable|exists:users,id',
            'contract_file'  => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'base_salary.numeric' => 'الراتب يجب أن يكون رقماً',
            'join_date.date'      => 'تاريخ الانضمام غير صالح',
        ];
    }
}
