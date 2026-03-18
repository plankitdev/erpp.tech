<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $companies = Company::withCount('users')->get();
        return $this->successResponse(CompanyResource::collection($companies));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:companies',
            'logo' => 'nullable|image|max:2048',
            'icon' => 'nullable|image|max:1024',
            'primary_color' => 'nullable|string|max:10',
            'settings' => 'nullable|array',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo'] = '/storage/' . $request->file('logo')->store('logos', 'public');
        }
        if ($request->hasFile('icon')) {
            $data['icon'] = '/storage/' . $request->file('icon')->store('icons', 'public');
        }

        $company = Company::create($data);
        return $this->successResponse(new CompanyResource($company->loadCount('users')), 'تم إنشاء الشركة بنجاح', 201);
    }

    public function show(Company $company): JsonResponse
    {
        return $this->successResponse(new CompanyResource($company->loadCount('users')));
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|unique:companies,slug,' . $company->id,
            'logo' => 'nullable|image|max:2048',
            'icon' => 'nullable|image|max:1024',
            'primary_color' => 'nullable|string|max:10',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);

        if ($request->hasFile('logo')) {
            if ($company->logo) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $company->logo));
            }
            $data['logo'] = '/storage/' . $request->file('logo')->store('logos', 'public');
        } else {
            unset($data['logo']);
        }

        if ($request->hasFile('icon')) {
            if ($company->icon) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $company->icon));
            }
            $data['icon'] = '/storage/' . $request->file('icon')->store('icons', 'public');
        } else {
            unset($data['icon']);
        }

        $company->update($data);
        return $this->successResponse(new CompanyResource($company->loadCount('users')), 'تم تحديث الشركة');
    }

    public function destroy(Company $company): JsonResponse
    {
        $company->update(['is_active' => false]);
        return $this->successResponse(null, 'تم تعطيل الشركة');
    }
}
