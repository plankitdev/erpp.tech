<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id'      => 'required|exists:employees,id',
            'month'            => 'required|integer|between:1,12',
            'year'             => 'required|integer|min:2020|max:2099',
            'base_salary'      => 'required|numeric|min:0',
            'bonus'            => 'nullable|numeric|min:0',
            'bonus_reason'     => 'nullable|string|max:500',
            'deductions'       => 'nullable|numeric|min:0',
            'deduction_reason' => 'nullable|string|max:500',
            'total'            => 'required|numeric|min:0',
            'transfer_amount'  => 'nullable|numeric|min:0',
            'remaining'        => 'nullable|numeric|min:0',
            'payment_date'     => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'الموظف مطلوب',
            'employee_id.exists'   => 'الموظف غير موجود',
            'month.required'       => 'الشهر مطلوب',
            'month.between'        => 'الشهر يجب أن يكون بين 1 و 12',
            'year.required'        => 'السنة مطلوبة',
            'base_salary.required' => 'الراتب الأساسي مطلوب',
            'total.required'       => 'الإجمالي مطلوب',
        ];
    }
}
