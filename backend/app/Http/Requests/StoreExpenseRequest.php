<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category'     => ['required', 'string', 'max:100'],
            'amount'       => ['required', 'numeric', 'min:0'],
            'currency'     => ['required', 'in:EGP,USD,SAR'],
            'date'         => ['required', 'date'],
            'notes'        => ['nullable', 'string'],
            'reference_id' => ['nullable', 'string', 'max:100'],
        ];
    }
}
