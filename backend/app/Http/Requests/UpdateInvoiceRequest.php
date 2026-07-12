<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'              => ['sometimes', 'numeric', 'min:0'],
            'items'               => ['sometimes', 'nullable', 'array'],
            'items.*.description' => ['required_with:items', 'string', 'max:500'],
            'items.*.quantity'    => ['required_with:items', 'numeric', 'min:0'],
            'items.*.unit_price'  => ['required_with:items', 'numeric', 'min:0'],
            'currency'            => ['sometimes', Rule::in(['EGP', 'USD', 'SAR'])],
            'due_date'            => ['sometimes', 'date'],
            'status'              => ['sometimes', Rule::in(Invoice::STATUSES)],
        ];
    }
}
