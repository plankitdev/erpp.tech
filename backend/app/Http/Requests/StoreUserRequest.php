<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users',
            'password'      => 'required|string|min:8',
            'role'          => 'required|in:super_admin,manager,accountant,sales,employee,marketing_manager',
            'company_id'    => 'required|exists:companies,id',
            'phone'         => 'nullable|string|max:20',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'       => 'الاسم مطلوب',
            'email.required'      => 'البريد الإلكتروني مطلوب',
            'email.email'         => 'البريد الإلكتروني غير صالح',
            'email.unique'        => 'البريد الإلكتروني مسجل مسبقاً',
            'password.required'   => 'كلمة المرور مطلوبة',
            'password.min'        => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            'role.required'       => 'الدور مطلوب',
            'role.in'             => 'الدور غير صالح',
            'company_id.required' => 'الشركة مطلوبة',
            'company_id.exists'   => 'الشركة غير موجودة',
        ];
    }
}
