<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id'          => 'required|exists:clients,id',
            'value'              => 'required|numeric|min:0',
            'currency'           => 'required|in:EGP,USD,SAR',
            'payment_type'       => 'required|in:monthly,installments',
            'start_date'         => 'required|date',
            'end_date'           => 'nullable|date|after:start_date',
            'installments_count' => 'nullable|integer|min:1',
            'installment_amount' => 'nullable|numeric|min:0',
            'notes'              => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'العميل مطلوب',
            'client_id.exists'   => 'العميل غير موجود',
            'value.required'     => 'قيمة العقد مطلوبة',
            'value.min'          => 'قيمة العقد يجب أن تكون أكبر من صفر',
            'currency.required'  => 'العملة مطلوبة',
            'start_date.required'=> 'تاريخ البداية مطلوب',
            'end_date.after'     => 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
        ];
    }
}
