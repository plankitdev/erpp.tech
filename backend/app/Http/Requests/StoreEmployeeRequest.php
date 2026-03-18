<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id'     => 'nullable|exists:companies,id',
            'name'           => 'required|string|max:255',
            'position'       => 'required|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'national_id'    => 'nullable|string|max:50',
            'address'        => 'nullable|string|max:500',
            'bank_name'      => 'nullable|string|max:255',
            'bank_account'   => 'nullable|string|max:100',
            'base_salary'    => 'required|numeric|min:0',
            'join_date'      => 'required|date',
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
            'name.required'        => 'اسم الموظف مطلوب',
            'position.required'    => 'المسمى الوظيفي مطلوب',
            'base_salary.required' => 'الراتب الأساسي مطلوب',
            'base_salary.numeric'  => 'الراتب يجب أن يكون رقماً',
            'join_date.required'   => 'تاريخ الانضمام مطلوب',
            'join_date.date'       => 'تاريخ الانضمام غير صالح',
        ];
    }
}
