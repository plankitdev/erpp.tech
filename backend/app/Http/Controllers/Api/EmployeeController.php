<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\EmployeeFileResource;
use App\Models\Employee;
use App\Models\EmployeeFile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Employee::class);

        $query = Employee::with('user')->withCount('files');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $employees = $query->latest()->paginate($this->getPerPage());

        return $this->paginatedResponse($employees);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $this->authorize('create', Employee::class);

        $data = $request->validated();

        if ($request->hasFile('contract_file')) {
            $data['contract_file'] = $request->file('contract_file')->store('contracts', 'public');
        }

        $employee = Employee::create($data);
        return $this->successResponse(new EmployeeResource($employee->load('user')), 'تم إضافة الموظف بنجاح', 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        $this->authorize('view', $employee);

        $employee->load(['user', 'files.uploader', 'salaryPayments' => fn($q) => $q->latest('year')->latest('month')]);
        return $this->successResponse(new EmployeeResource($employee));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $this->authorize('update', $employee);

        $data = $request->validated();

        if ($request->hasFile('contract_file')) {
            $data['contract_file'] = $request->file('contract_file')->store('contracts', 'public');
        }

        $employee->update($data);
        return $this->successResponse(new EmployeeResource($employee->load('user')), 'تم تحديث الموظف');
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $this->authorize('delete', $employee);

        $employee->delete();
        return $this->successResponse(null, 'تم حذف الموظف');
    }

    public function uploadFile(Request $request, Employee $employee): JsonResponse
    {
        $this->authorize('update', $employee);

        $request->validate([
            'file' => 'required|file|max:10240',
            'type' => 'nullable|string|max:100',
        ]);

        $file = $request->file('file');
        $path = $file->store("employee-files/{$employee->id}", 'public');

        $empFile = $employee->files()->create([
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'type'        => $request->input('type', 'other'),
            'uploaded_by' => auth()->id(),
        ]);

        return $this->successResponse(new EmployeeFileResource($empFile->load('uploader')), 'تم رفع الملف', 201);
    }

    public function deleteFile(Employee $employee, EmployeeFile $file): JsonResponse
    {
        $this->authorize('update', $employee);

        if ($file->employee_id !== $employee->id) {
            return $this->errorResponse('الملف غير تابع لهذا الموظف', 403);
        }

        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return $this->successResponse(null, 'تم حذف الملف');
    }
}
