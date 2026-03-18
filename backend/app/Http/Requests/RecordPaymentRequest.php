<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'notes'  => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'مبلغ الدفعة مطلوب',
            'amount.min'      => 'مبلغ الدفعة يجب أن يكون أكبر من صفر',
        ];
    }
}
