<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'position'       => $this->position,
            'phone'          => $this->phone,
            'email'          => $this->email,
            'national_id'    => $this->national_id,
            'address'        => $this->address,
            'bank_name'      => $this->bank_name,
            'bank_account'   => $this->bank_account,
            'base_salary'    => $this->base_salary,
            'join_date'      => $this->join_date?->format('Y-m-d'),
            'contract_start' => $this->contract_start?->format('Y-m-d'),
            'contract_end'   => $this->contract_end?->format('Y-m-d'),
            'contract_file'  => $this->contract_file,
            'notes'          => $this->notes,
            'user'           => new UserResource($this->whenLoaded('user')),
            'files'          => EmployeeFileResource::collection($this->whenLoaded('files')),
            'salary_payments' => SalaryPaymentResource::collection($this->whenLoaded('salaryPayments')),
            'files_count'    => $this->whenCounted('files'),
            'created_at'     => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
