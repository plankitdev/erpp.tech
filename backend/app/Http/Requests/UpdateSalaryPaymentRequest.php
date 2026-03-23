<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSalaryPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'base_salary'      => ['sometimes', 'numeric', 'min:0'],
            'bonus'            => ['nullable', 'numeric', 'min:0'],
            'bonus_reason'     => ['nullable', 'string', 'max:500'],
            'deductions'       => ['nullable', 'numeric', 'min:0'],
            'deduction_reason' => ['nullable', 'string'],
            'total'            => ['sometimes', 'numeric'],
            'transfer_amount'  => ['sometimes', 'numeric', 'min:0'],
            'remaining'        => ['sometimes', 'numeric'],
            'payment_date'     => ['sometimes', 'date'],
        ];
    }
}
