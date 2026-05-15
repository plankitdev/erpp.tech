<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartOfAccountController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = ChartOfAccount::with('children')
            ->when($request->type, fn($q, $type) => $q->where('type', $type))
            ->when($request->boolean('root_only'), fn($q) => $q->whereNull('parent_id'))
            ->orderBy('code');

        if ($request->boolean('all')) {
            return $this->successResponse($query->get());
        }

        return $this->paginatedResponse($query->paginate($this->getPerPage(50)));
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = auth()->user()->company_id;
        $data = $request->validate([
            'parent_id'   => 'nullable|exists:chart_of_accounts,id',
            'code'        => "required|string|max:20|unique:chart_of_accounts,code,NULL,id,company_id,{$companyId}",
            'name'        => 'required|string|max:255',
            'name_en'     => 'nullable|string|max:255',
            'type'        => 'required|in:asset,liability,equity,revenue,expense',
            'nature'      => 'required|in:debit,credit',
            'description' => 'nullable|string',
        ], [
            'code.required'  => 'رمز الحساب مطلوب',
            'code.unique'    => 'رمز الحساب مستخدم بالفعل',
            'name.required'  => 'اسم الحساب مطلوب',
            'type.required'  => 'نوع الحساب مطلوب',
            'type.in'        => 'نوع الحساب غير صالح',
            'nature.required'=> 'طبيعة الحساب مطلوبة',
        ]);

        $account = ChartOfAccount::create($data);
        return $this->successResponse($account->load('children'), 'تم إنشاء الحساب بنجاح', 201);
    }

    public function show(ChartOfAccount $chartOfAccount): JsonResponse
    {
        return $this->successResponse(
            $chartOfAccount->load(['parent', 'children'])
        );
    }

    public function update(Request $request, ChartOfAccount $chartOfAccount): JsonResponse
    {
        if ($chartOfAccount->is_system) {
            return $this->errorResponse('لا يمكن تعديل حساب نظام', 403);
        }

        $companyId = auth()->user()->company_id;
        $data = $request->validate([
            'parent_id'   => 'nullable|exists:chart_of_accounts,id',
            'code'        => "sometimes|string|max:20|unique:chart_of_accounts,code,{$chartOfAccount->id},id,company_id,{$companyId}",
            'name'        => 'sometimes|string|max:255',
            'name_en'     => 'nullable|string|max:255',
            'type'        => 'sometimes|in:asset,liability,equity,revenue,expense',
            'nature'      => 'sometimes|in:debit,credit',
            'is_active'   => 'sometimes|boolean',
            'description' => 'nullable|string',
        ], [
            'code.unique' => 'رمز الحساب مستخدم بالفعل',
        ]);

        // Prevent circular parent references
        if (isset($data['parent_id']) && $data['parent_id'] == $chartOfAccount->id) {
            return $this->errorResponse('لا يمكن تعيين الحساب كأب لنفسه', 422);
        }

        $chartOfAccount->update($data);
        return $this->successResponse($chartOfAccount->fresh()->load('children'), 'تم تحديث الحساب بنجاح');
    }

    public function destroy(ChartOfAccount $chartOfAccount): JsonResponse
    {
        if ($chartOfAccount->is_system) {
            return $this->errorResponse('لا يمكن حذف حساب نظام', 403);
        }

        if ($chartOfAccount->children()->exists()) {
            return $this->errorResponse('لا يمكن حذف حساب له حسابات فرعية', 422);
        }

        if ($chartOfAccount->journalLines()->exists()) {
            return $this->errorResponse('لا يمكن حذف حساب مرتبط بقيود يومية', 422);
        }

        $chartOfAccount->delete();
        return $this->successResponse(null, 'تم حذف الحساب بنجاح');
    }

    public function tree(): JsonResponse
    {
        $accounts = ChartOfAccount::with('children.children.children')
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get();

        return $this->successResponse($accounts);
    }

    public function seed(): JsonResponse
    {
        // Only admin can seed chart of accounts
        if (!in_array(auth()->user()->role, ['super_admin', 'company_admin'])) {
            return $this->errorResponse('غير مصرح لك بهذا الإجراء', 403);
        }

        $companyId = auth()->user()->company_id;

        if (ChartOfAccount::where('company_id', $companyId)->exists()) {
            return $this->errorResponse('دليل الحسابات موجود بالفعل', 422);
        }

        $this->seedDefaultAccounts($companyId);

        return $this->successResponse(null, 'تم إنشاء دليل الحسابات الافتراضي بنجاح');
    }

    private function seedDefaultAccounts(int $companyId): void
    {
        $accounts = [
            // أصول
            ['code' => '1000', 'name' => 'الأصول', 'type' => 'asset', 'nature' => 'debit', 'children' => [
                ['code' => '1100', 'name' => 'الأصول المتداولة', 'type' => 'asset', 'nature' => 'debit', 'children' => [
                    ['code' => '1101', 'name' => 'النقدية والبنوك', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1102', 'name' => 'العملاء (ذمم مدينة)', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1103', 'name' => 'مدفوعات مقدمة', 'type' => 'asset', 'nature' => 'debit'],
                ]],
                ['code' => '1200', 'name' => 'الأصول الثابتة', 'type' => 'asset', 'nature' => 'debit', 'children' => [
                    ['code' => '1201', 'name' => 'المعدات', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1202', 'name' => 'الأثاث', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1203', 'name' => 'السيارات', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1204', 'name' => 'الأجهزة الإلكترونية', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1205', 'name' => 'العقارات', 'type' => 'asset', 'nature' => 'debit'],
                    ['code' => '1299', 'name' => 'مجمع الإهلاك', 'type' => 'asset', 'nature' => 'credit'],
                ]],
            ]],
            // التزامات
            ['code' => '2000', 'name' => 'الالتزامات', 'type' => 'liability', 'nature' => 'credit', 'children' => [
                ['code' => '2100', 'name' => 'الالتزامات المتداولة', 'type' => 'liability', 'nature' => 'credit', 'children' => [
                    ['code' => '2101', 'name' => 'رواتب مستحقة', 'type' => 'liability', 'nature' => 'credit'],
                    ['code' => '2102', 'name' => 'ضرائب مستحقة', 'type' => 'liability', 'nature' => 'credit'],
                    ['code' => '2103', 'name' => 'مصروفات مستحقة', 'type' => 'liability', 'nature' => 'credit'],
                ]],
            ]],
            // حقوق الملكية
            ['code' => '3000', 'name' => 'حقوق الملكية', 'type' => 'equity', 'nature' => 'credit', 'children' => [
                ['code' => '3001', 'name' => 'رأس المال', 'type' => 'equity', 'nature' => 'credit'],
                ['code' => '3002', 'name' => 'أرباح مبقاة', 'type' => 'equity', 'nature' => 'credit'],
                ['code' => '3003', 'name' => 'أرباح العام الحالي', 'type' => 'equity', 'nature' => 'credit'],
            ]],
            // إيرادات
            ['code' => '4000', 'name' => 'الإيرادات', 'type' => 'revenue', 'nature' => 'credit', 'children' => [
                ['code' => '4001', 'name' => 'إيرادات الخدمات', 'type' => 'revenue', 'nature' => 'credit'],
                ['code' => '4002', 'name' => 'إيرادات المشاريع', 'type' => 'revenue', 'nature' => 'credit'],
                ['code' => '4003', 'name' => 'إيرادات أخرى', 'type' => 'revenue', 'nature' => 'credit'],
            ]],
            // مصروفات
            ['code' => '5000', 'name' => 'المصروفات', 'type' => 'expense', 'nature' => 'debit', 'children' => [
                ['code' => '5100', 'name' => 'مصروفات تشغيلية', 'type' => 'expense', 'nature' => 'debit', 'children' => [
                    ['code' => '5101', 'name' => 'رواتب وأجور', 'type' => 'expense', 'nature' => 'debit'],
                    ['code' => '5102', 'name' => 'إيجارات', 'type' => 'expense', 'nature' => 'debit'],
                    ['code' => '5103', 'name' => 'مرافق (كهرباء، ماء، إنترنت)', 'type' => 'expense', 'nature' => 'debit'],
                    ['code' => '5104', 'name' => 'تسويق وإعلان', 'type' => 'expense', 'nature' => 'debit'],
                    ['code' => '5105', 'name' => 'مستلزمات مكتبية', 'type' => 'expense', 'nature' => 'debit'],
                ]],
                ['code' => '5200', 'name' => 'مصروفات إدارية', 'type' => 'expense', 'nature' => 'debit', 'children' => [
                    ['code' => '5201', 'name' => 'مصروفات بنكية', 'type' => 'expense', 'nature' => 'debit'],
                    ['code' => '5202', 'name' => 'تأمينات', 'type' => 'expense', 'nature' => 'debit'],
                    ['code' => '5203', 'name' => 'إهلاك أصول ثابتة', 'type' => 'expense', 'nature' => 'debit'],
                ]],
                ['code' => '5300', 'name' => 'مصروفات أخرى', 'type' => 'expense', 'nature' => 'debit'],
            ]],
        ];

        foreach ($accounts as $account) {
            $this->createAccountTree($companyId, $account, null);
        }
    }

    private function createAccountTree(int $companyId, array $data, ?int $parentId): void
    {
        $children = $data['children'] ?? [];
        unset($data['children']);

        $account = ChartOfAccount::create([
            ...$data,
            'company_id' => $companyId,
            'parent_id'  => $parentId,
            'is_system'  => true,
        ]);

        foreach ($children as $child) {
            $this->createAccountTree($companyId, $child, $account->id);
        }
    }
}
