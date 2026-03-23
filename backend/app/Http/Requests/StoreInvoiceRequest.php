<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_id' => 'nullable|exists:contracts,id',
            'client_id'   => 'nullable|exists:clients,id',
            'amount'      => 'required|numeric|min:0.01',
            'currency'    => 'required|in:EGP,USD,SAR',
            'due_date'    => 'required|date',
            'issue_date'  => 'nullable|date',
            'notes'       => 'nullable|string',
            'is_paid'     => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'contract_id.required' => 'العقد مطلوب',
            'amount.required'      => 'المبلغ مطلوب',
            'amount.min'           => 'المبلغ يجب أن يكون أكبر من صفر',
            'due_date.required'    => 'تاريخ الاستحقاق مطلوب',
        ];
    }
}
