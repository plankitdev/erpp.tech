<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category'     => ['sometimes', 'string', 'max:100'],
            'amount'       => ['sometimes', 'numeric', 'min:0'],
            'currency'     => ['sometimes', 'in:EGP,USD,SAR'],
            'date'         => ['sometimes', 'date'],
            'notes'        => ['nullable', 'string'],
            'reference_id' => ['nullable', 'string', 'max:100'],
        ];
    }
}
