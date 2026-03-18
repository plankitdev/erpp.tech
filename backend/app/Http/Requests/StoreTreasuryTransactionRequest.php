<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTreasuryTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'        => 'required|in:in,out',
            'amount'      => 'required|numeric|min:0.01',
            'currency'    => 'required|in:EGP,USD,SAR',
            'category'    => 'required|string|max:255',
            'date'        => 'required|date',
            'description' => 'required|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'        => 'نوع المعاملة مطلوب',
            'type.in'              => 'نوع المعاملة يجب أن يكون وارد أو صادر',
            'amount.required'      => 'المبلغ مطلوب',
            'amount.min'           => 'المبلغ يجب أن يكون أكبر من صفر',
            'currency.required'    => 'العملة مطلوبة',
            'currency.in'          => 'العملة يجب أن تكون EGP أو USD أو SAR',
            'category.required'    => 'التصنيف مطلوب',
            'date.required'        => 'التاريخ مطلوب',
            'description.required' => 'الوصف مطلوب',
        ];
    }
}
