<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $companies = Company::withCount('users')->where('is_active', true)->get();
        return $this->successResponse(CompanyResource::collection($companies));
    }

    public function switch(Company $company, Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        $token = $request->user()->createToken('auth-token', ['company:' . $company->id])->plainTextToken;

        return $this->successResponse([
            'token'   => $token,
            'company' => new CompanyResource($company),
        ], 'تم التبديل للشركة: ' . $company->name);
    }
}
