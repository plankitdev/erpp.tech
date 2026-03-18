<?php

namespace App\Http\Requests;

use App\Models\Contract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id'          => ['sometimes', 'exists:clients,id'],
            'value'              => ['sometimes', 'numeric', 'min:0'],
            'currency'           => ['sometimes', Rule::in(['EGP', 'USD', 'SAR'])],
            'payment_type'       => ['sometimes', Rule::in(Contract::PAYMENT_TYPES)],
            'start_date'         => ['sometimes', 'date'],
            'end_date'           => ['nullable', 'date'],
            'installments_count' => ['nullable', 'integer', 'min:1'],
            'installment_amount' => ['nullable', 'numeric', 'min:0'],
            'status'             => ['sometimes', Rule::in(Contract::STATUSES)],
            'notes'              => ['nullable', 'string'],
        ];
    }
}
