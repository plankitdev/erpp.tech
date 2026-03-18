<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'       => 'required|numeric|min:0.01',
            'currency'     => 'required|string|max:3',
            'month'        => 'required|integer|min:1|max:12',
            'year'         => 'required|integer|min:2020|max:2099',
            'payment_date' => 'required|date',
            'type'         => 'required|in:profit_share,advance,expense,withdrawal,capital_contribution,deposit',
            'notes'        => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required'       => 'المبلغ مطلوب',
            'amount.min'            => 'المبلغ يجب أن يكون أكبر من صفر',
            'currency.required'     => 'العملة مطلوبة',
            'month.required'        => 'الشهر مطلوب',
            'year.required'         => 'السنة مطلوبة',
            'payment_date.required' => 'تاريخ الدفع مطلوب',
            'type.required'         => 'نوع الدفعة مطلوب',
            'type.in'               => 'نوع الدفعة غير صالح',
        ];
    }
}
