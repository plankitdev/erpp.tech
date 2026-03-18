📋 ERPFlex — Best Practices Guide
ضيف الملف ده في الـ root باسم BEST_PRACTICES.md

🏗️ 1. Architecture & Structure
✅ القواعد الأساسية
text
✅ كل منطق الـ Business يروح في Service class — مش في Controller
✅ كل validation يروح في FormRequest — مش في Controller
✅ كل response يرجع عبر ApiResponse trait — مش response() مباشرة
✅ كل query فيها company_id scope — بدون استثناء
✅ Super Admin فقط يستخدم withoutGlobalScope()
❌ ممنوع تماماً
text
❌ لا logic في Controller غير استدعاء Service + return response
❌ لا DB queries في الـ Views أو الـ Resources
❌ لا تضع business rules في Migration أو Model مباشرة
❌ لا raw SQL إلا في حالات performance ضرورية موثقة
❌ لا hardcoded strings — استخدم constants أو config
مثال صح vs غلط
php
// ❌ غلط — logic في Controller
public function store(Request $request)
{
    $validated = $request->validate([...]);
    $total = $validated['amount'] * 0.14; // tax calculation هنا!!
    Client::create([...$validated, 'tax' => $total]);
    return response()->json(['data' => ...]);
}

// ✅ صح — Controller نظيف
public function store(StoreClientRequest $request)
{
    $client = $this->clientService->create($request->validated());
    return $this->successResponse(new ClientResource($client), 'تم إضافة العميل', 201);
}
🗄️ 2. Database Best Practices
Migrations
php
// ✅ كل جدول لازم يبدأ بكده
$table->id();
$table->foreignId('company_id')->constrained()->cascadeOnDelete();
// ... باقي الحقول
$table->timestamps();

// ✅ للجداول اللي بتتحذف soft
$table->softDeletes();

// ✅ Indexes إلزامية على كل جدول
$table->index(['company_id', 'status']);
$table->index(['company_id', 'created_at']);
Naming Conventions
text
Tables:      snake_case plural     → clients, salary_payments, treasury_transactions
Models:      PascalCase singular   → Client, SalaryPayment, TreasuryTransaction
Controllers: PascalCase + Resource → ClientController, SalaryPaymentController
Requests:    Action + Model        → StoreClientRequest, UpdateSalaryRequest
Resources:   Model + Resource      → ClientResource, InvoiceResource
Enum Values — دايمًا في Model
php
// ✅ تعريف الـ Enums كـ constants في Model
class Invoice extends Model
{
    const STATUS_PENDING  = 'pending';
    const STATUS_PAID     = 'paid';
    const STATUS_OVERDUE  = 'overdue';
    const STATUS_PARTIAL  = 'partial';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
        self::STATUS_OVERDUE,
        self::STATUS_PARTIAL,
    ];
}

// ✅ الاستخدام في Migration
$table->enum('status', Invoice::STATUSES)->default(Invoice::STATUS_PENDING);

// ✅ الاستخدام في Query
Invoice::where('status', Invoice::STATUS_OVERDUE)->get();
🔐 3. Security Best Practices
Multi-Tenant Isolation
php
// ✅ اختبر الـ isolation بعد كل Model جديد
// في كل test:
$companyA = Company::factory()->create();
$companyB = Company::factory()->create();
$userA    = User::factory()->for($companyA)->create(['role' => 'manager']);
$clientB  = Client::factory()->for($companyB)->create();

$this->actingAs($userA)
     ->getJson("/api/clients/{$clientB->id}")
     ->assertStatus(404); // مش 403 — ما المفروض يعرف إنه موجود أصلاً
Authorization
php
// ✅ Policy لكل Resource
class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('clients');
    }

    public function update(User $user, Client $client): bool
    {
        // التحقق من company_id + الصلاحية
        return $user->company_id === $client->company_id
            && $user->canAccess('clients');
    }
}

// ✅ استخدام في Controller
public function update(UpdateClientRequest $request, Client $client)
{
    $this->authorize('update', $client); // ← دايمًا
    ...
}
API Responses — لا تكشف معلومات حساسة
php
// ❌ غلط
return Client::all(); // بيرجع company_id وكل الحقول

// ✅ صح
return ClientResource::collection($clients); // Resource بتتحكم في إيه يظهر
⚛️ 4. React / Frontend Best Practices
Component Structure
text
✅ كل component في ملف منفصل
✅ Pages في /pages — Components في /components
✅ لا API calls داخل Component مباشرة — استخدم hooks
✅ لا useState للـ server data — استخدم TanStack Query
✅ كل form فيها Zod schema منفصلة
TypeScript Rules
ts
// ❌ غلط
const [data, setData] = useState<any>(null)
const handleSubmit = (values: any) => { ... }

// ✅ صح
const [data, setData] = useState<Client | null>(null)
const handleSubmit = (values: StoreClientForm) => { ... }

// ✅ كل API response عندها type
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
Forms Pattern
tsx
// ✅ الـ pattern الثابت لكل form في المشروع

// 1. Schema
const clientSchema = z.object({
  name:  z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  service: z.enum(['تسويق', 'تصميم', 'مودريشن', 'برمجة']),
})

type ClientForm = z.infer<typeof clientSchema>

// 2. Hook
const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<ClientForm>({ resolver: zodResolver(clientSchema) })

// 3. Submit
const { mutate, isPending } = useCreateClient()
const onSubmit = (data: ClientForm) => mutate(data)

// 4. Error Display — موحد في كل المشروع
{errors.name && (
  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
)}
Currency Display — دايمًا formatCurrency
tsx
// ❌ غلط
<span>{client.total_outstanding} ج.م</span>

// ✅ صح
<span>{formatCurrency(client.total_outstanding, client.currency)}</span>
🔄 5. Git & Version Control
Branch Strategy
text
main          ← production only — لا تعمل push مباشرة
develop       ← integration branch
feature/*     ← كل feature في branch منفصل
fix/*         ← bug fixes
Commit Messages — بالإنجليزي دايمًا
bash
# ✅ صح
git commit -m "feat(clients): add search and filter by status"
git commit -m "fix(auth): resolve company_id null on super admin login"
git commit -m "refactor(treasury): move balance calculation to TreasuryService"
git commit -m "test(clients): add tenant isolation test"

# ❌ غلط
git commit -m "edit"
git commit -m "changes"
git commit -m "fix bug"
قبل كل Commit — Checklist
text
□ الكود شغال وبيعمل الوظيفة المطلوبة
□ مفيش dd() أو var_dump() أو console.log() متنسية
□ الـ FormRequest موجودة ومش بيعمل validate في Controller
□ الـ company_id scope شغال على الـ Model الجديد
□ الـ API Resource مش بترجع حقول حساسة
□ الـ test الخاص بالـ feature اتكتب
🧪 6. Testing Strategy
ترتيب الـ Tests
text
Unit Tests    → Models, Services, Helpers
Feature Tests → API Endpoints
Browser Tests → Critical user flows (optional)
الـ Test الإلزامي لكل Module
php
// ✅ كل module لازم يحتوي على:

// 1. CRUD Tests
it('can list resources for own company only')
it('can create resource with valid data')
it('cannot create resource with invalid data')
it('can update own company resource')
it('can soft delete resource')

// 2. Isolation Test (الأهم)
it('cannot access other company resources')
it('returns 404 not 403 for other company resources')

// 3. Authorization Test
it('employee cannot access management endpoints')
it('accountant cannot modify clients')
Test Factory Pattern
php
// ✅ كل Model عنده Factory
class ClientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id'   => Company::factory(),
            'name'         => $this->faker->name(),
            'phone'        => $this->faker->phoneNumber(),
            'company_name' => $this->faker->company(),
            'sector'       => $this->faker->randomElement(['مطعم', 'مجوهرات', 'ملابس']),
            'service'      => $this->faker->randomElement(['تسويق', 'تصميم']),
            'status'       => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
📝 7. Code Documentation
PHP DocBlocks
php
/**
 * احسب صافي الربح للشركة في شهر معين.
 *
 * @param  int    $companyId
 * @param  int    $month  (1-12)
 * @param  int    $year
 * @return array  ['revenue' => float, 'expenses' => float, 'net_profit' => float]
 */
public function calculateMonthlyProfit(int $companyId, int $month, int $year): array
TypeScript JSDoc
ts
/**
 * تنسيق المبلغ مع العملة بالعربية
 * @param amount  - المبلغ كـ float
 * @param currency - كود العملة EGP | USD | SAR
 * @returns string مثال: "3,000.00 ج.م"
 */
export const formatCurrency = (amount: number, currency: Currency): string => { ... }
⚡ 8. Performance Best Practices
Eager Loading — إلزامي
php
// ❌ N+1 Problem
$clients = Client::all();
foreach ($clients as $client) {
    echo $client->activeContract->value; // query لكل client!!
}

// ✅ Eager Loading
$clients = Client::with('activeContract')->paginate(15);
Pagination — دايمًا
php
// ❌ ممنوع في production
Client::all(); // ممكن يرجع 10,000 سطر

// ✅ دايمًا paginate
Client::paginate(15);
Client::simplePaginate(20);
Caching للـ Reports
php
// ✅ التقارير الثقيلة بتتـcache
public function getMonthlyReport(int $month, int $year)
{
    $key = "report.monthly.{$this->companyId}.{$year}.{$month}";

    return Cache::remember($key, now()->addHours(6), function () use ($month, $year) {
        return $this->calculateMonthlyReport($month, $year);
    });
}
🔔 9. Error Handling
Backend — Consistent Errors
php
// app/Exceptions/Handler.php
// ✅ كل الـ exceptions بترجع نفس الشكل

public function render($request, Throwable $e)
{
    if ($request->expectsJson()) {
        return match (true) {
            $e instanceof ValidationException =>
                response()->json(['success' => false, 'message' => 'بيانات غير صحيحة', 'errors' => $e->errors()], 422),

            $e instanceof AuthenticationException =>
                response()->json(['success' => false, 'message' => 'يرجى تسجيل الدخول'], 401),

            $e instanceof AuthorizationException =>
                response()->json(['success' => false, 'message' => 'غير مصرح لك بهذه العملية'], 403),

            $e instanceof ModelNotFoundException =>
                response()->json(['success' => false, 'message' => 'العنصر غير موجود'], 404),

            default =>
                response()->json(['success' => false, 'message' => 'حدث خطأ في الخادم'], 500),
        };
    }
    return parent::render($request, $e);
}
Frontend — Error Boundaries
tsx
// ✅ كل page فيها error state واضح
const { data, isLoading, isError } = useClients()

if (isLoading) return <LoadingSpinner />
if (isError)   return <ErrorMessage message="حدث خطأ في تحميل البيانات" />
if (!data?.data.length) return <EmptyState message="لا يوجد عملاء بعد" />

return <ClientsTable data={data.data} />
📁 10. File Naming Quick Reference
text
Laravel:
controllers/   ClientController.php
requests/      StoreClientRequest.php / UpdateClientRequest.php
resources/     ClientResource.php
models/        Client.php
services/      ClientService.php
policies/      ClientPolicy.php
migrations/    2026_01_01_000000_create_clients_table.php
tests/         ClientTest.php

React:
pages/         ClientsPage.tsx / ClientProfilePage.tsx
components/    ClientCard.tsx / ClientForm.tsx / ClientsTable.tsx
hooks/         useClients.ts / useCreateClient.ts
api/           clients.ts
types/         client.ts
🚦 الـ Code Review Checklist
قبل ما أي كود يتـmerge، لازم يعدي على النقاط دي:

text
Security:
□ company_id scope موجود على كل Model جديد
□ مفيش بيانات حساسة بترجع في الـ API
□ الـ Policy موجودة ومستخدمة في Controller

Code Quality:
□ لا منطق في Controller — استخدم Service
□ لا validate في Controller — استخدم FormRequest
□ لا raw response — استخدم ApiResponse trait
□ Eager loading موجود — مفيش N+1
□ Pagination موجودة — مفيش .all()

Frontend:
□ لا any في TypeScript
□ لا API calls في Component مباشرة
□ كل form فيها Zod validation
□ كل monetary value بيعدي على formatCurrency()
□ Loading + Error + Empty states موجودين

Tests:
□ Unit test للـ Service
□ Feature test للـ Endpoint
□ Isolation test للـ multi-tenant
□ الـ test بيعدي بنجاح محلياً