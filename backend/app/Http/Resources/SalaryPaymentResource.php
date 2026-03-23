<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'month'            => $this->month,
            'year'             => $this->year,
            'base_salary'      => $this->base_salary,
            'bonus'            => $this->bonus,
            'bonus_reason'     => $this->bonus_reason,
            'deductions'       => $this->deductions,
            'deduction_reason' => $this->deduction_reason,
            'total'            => $this->total,
            'transfer_amount'  => $this->transfer_amount,
            'remaining'        => $this->remaining,
            'payment_date'     => $this->payment_date?->format('Y-m-d'),
            'employee'         => new EmployeeResource($this->whenLoaded('employee')),
            'created_at'       => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
