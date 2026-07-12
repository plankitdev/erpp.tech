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
            'contract_id'         => 'nullable|exists:contracts,id',
            'client_id'           => 'nullable|exists:clients,id',
            // amount is optional when line items are supplied (it is computed from them)
            'amount'              => 'required_without:items|nullable|numeric|min:0.01',
            'items'               => 'nullable|array',
            'items.*.description' => 'required_with:items|string|max:500',
            'items.*.quantity'    => 'required_with:items|numeric|min:0',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
            'vat_rate'            => 'nullable|numeric|min:0|max:100',
            'currency'            => 'required|in:EGP,USD,SAR',
            'status'              => 'nullable|in:draft,sent,pending',
            'due_date'            => 'nullable|date',
            'issue_date'          => 'nullable|date',
            'notes'               => 'nullable|string',
            'is_paid'             => 'nullable|boolean',
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
