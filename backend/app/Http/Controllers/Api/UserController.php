<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Lightweight user list for dropdowns/assignments (all authenticated users).
     */
    public function list(Request $request): JsonResponse
    {
        // Return ALL active users — this list feeds task assignees, chat, quick
        // create, etc. Each row carries `employee_id` so the employee-link form
        // can flag (and disable) users already linked to another employee,
        // instead of hiding them from every user picker in the app.
        $users = User::where('is_active', true)
            ->with('employee:id,user_id')
            ->get(['id', 'name', 'email', 'role', 'avatar'])
            ->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'role'        => $u->role,
                'avatar'      => $u->avatar,
                'employee_id' => $u->employee?->id,
            ]);

        return $this->successResponse($users);
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', User::class);
        $users = User::with('company')->get();
        return $this->successResponse(UserResource::collection($users));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return $this->successResponse(new UserResource($user->load('company')), 'تم إضافة المستخدم بنجاح', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return $this->successResponse(new UserResource($user->load('company')), 'تم تحديث المستخدم');
    }

    public function resetPassword(User $user): JsonResponse
    {
        $this->authorize('resetPassword', $user);
        $newPassword = 'Pass@' . rand(1000, 9999);
        $user->update([
            'password' => Hash::make($newPassword),
            'force_password_change' => true,
        ]);
        $user->tokens()->delete();

        return $this->successResponse(
            ['new_password' => $newPassword],
            'تم إعادة تعيين كلمة المرور'
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);
        $user->delete();
        return $this->successResponse(null, 'تم حذف المستخدم');
    }

    public function allPermissions(): JsonResponse
    {
        return $this->successResponse([
            'permissions'       => User::getAllPermissions(),
            'permission_labels' => User::getPermissionLabels(),
            'action_labels'     => User::getActionLabels(),
        ]);
    }

    public function defaultPermissions(string $role): JsonResponse
    {
        return $this->successResponse(User::getDefaultPermissions($role));
    }
}
