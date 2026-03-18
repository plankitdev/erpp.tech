<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:users,email,' . $this->route('user')?->id,
            'role'          => 'sometimes|in:super_admin,manager,accountant,sales,employee',
            'company_id'    => 'sometimes|exists:companies,id',
            'password'      => 'nullable|string|min:8',
            'phone'         => 'nullable|string|max:20',
            'is_active'     => 'sometimes|boolean',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string',
        ];
    }

    public function messages(): array
    {
        return [
            'email.email'         => 'البريد الإلكتروني غير صالح',
            'email.unique'        => 'البريد الإلكتروني مسجل مسبقاً',
            'password.min'        => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            'role.in'             => 'الدور غير صالح',
            'company_id.exists'   => 'الشركة غير موجودة',
        ];
    }
}
