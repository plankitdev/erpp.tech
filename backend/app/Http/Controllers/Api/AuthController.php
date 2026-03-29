<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->errorResponse('بيانات الدخول غير صحيحة', 401);
        }

        if (!$user->is_active) {
            return $this->errorResponse('الحساب موقوف، تواصل مع الإدارة', 403);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'token'          => $token,
            'user'           => new UserResource($user->load('company')),
            'company'        => $user->company ? new CompanyResource($user->company) : null,
            'is_super_admin' => $user->isSuperAdmin(),
            'force_password_change' => (bool) $user->force_password_change,
        ], 'تم تسجيل الدخول بنجاح');
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }
        return $this->successResponse(null, 'تم تسجيل الخروج');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse(
            new UserResource($request->user()->load('company'))
        );
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return $this->successResponse(
            new UserResource($user->load('company')),
            'تم تحديث الصورة الشخصية'
        );
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->update(['name' => $request->name]);

        return $this->successResponse(
            new UserResource($user->load('company')),
            'تم تحديث البيانات الشخصية'
        );
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'force_password_change' => false,
        ]);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->errorResponse('البريد الإلكتروني غير مسجل', 404);
        }

        $status = Password::sendResetLink(['email' => $request->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return $this->successResponse(null, 'تم إرسال رابط إعادة تعيين كلمة المرور');
        }

        if ($status === Password::RESET_THROTTLED) {
            return $this->errorResponse('تم تجاوز الحد المسموح، حاول لاحقاً', 429);
        }

        return $this->errorResponse('حدث خطأ أثناء إرسال الرابط', 500);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                    'force_password_change' => false,
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->successResponse(null, 'تم إعادة تعيين كلمة المرور بنجاح');
        }

        return $this->errorResponse('رابط إعادة التعيين غير صالح أو منتهي الصلاحية', 422);
    }
}
