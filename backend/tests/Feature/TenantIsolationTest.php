<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Contract;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Partner;
use App\Models\SalaryPayment;
use App\Models\Task;
use App\Models\TreasuryTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Company $companyA;
    private Company $companyB;
    private User $userA;
    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->companyA = Company::factory()->create(['name' => 'Company A']);
        $this->companyB = Company::factory()->create(['name' => 'Company B']);

        $this->userA = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'manager',
            'is_active' => true,
        ]);

        $this->userB = User::factory()->create([
            'company_id' => $this->companyB->id,
            'role' => 'manager',
            'is_active' => true,
        ]);
    }

    // ─── Clients ───────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_clients(): void
    {
        $clientA = Client::factory()->create(['company_id' => $this->companyA->id]);
        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/clients');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($clientA->id, $ids);
        $this->assertNotContains($clientB->id, $ids);
    }

    public function test_user_cannot_show_other_company_client(): void
    {
        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->getJson("/api/clients/{$clientB->id}");

        $response->assertStatus(404);
    }

    public function test_user_cannot_update_other_company_client(): void
    {
        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->putJson("/api/clients/{$clientB->id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('clients', ['id' => $clientB->id, 'name' => 'Hacked Name']);
    }

    public function test_user_cannot_delete_other_company_client(): void
    {
        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->deleteJson("/api/clients/{$clientB->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('clients', ['id' => $clientB->id]);
    }

    // ─── Invoices ──────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_invoices(): void
    {
        $clientA = Client::factory()->create(['company_id' => $this->companyA->id]);
        $contractA = Contract::factory()->create(['company_id' => $this->companyA->id, 'client_id' => $clientA->id]);
        $invoiceA = Invoice::factory()->create(['company_id' => $this->companyA->id, 'contract_id' => $contractA->id]);

        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);
        $contractB = Contract::factory()->create(['company_id' => $this->companyB->id, 'client_id' => $clientB->id]);
        $invoiceB = Invoice::factory()->create(['company_id' => $this->companyB->id, 'contract_id' => $contractB->id]);

        $this->actingAs($this->userA->fresh());
        $response = $this->getJson('/api/invoices');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($invoiceA->id, $ids);
        $this->assertNotContains($invoiceB->id, $ids);
    }

    public function test_user_cannot_access_other_company_invoice(): void
    {
        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);
        $contractB = Contract::factory()->create(['company_id' => $this->companyB->id, 'client_id' => $clientB->id]);
        $invoiceB = Invoice::factory()->create(['company_id' => $this->companyB->id, 'contract_id' => $contractB->id]);

        $response = $this->actingAs($this->userA)->getJson("/api/invoices/{$invoiceB->id}");

        $response->assertStatus(404);
    }

    public function test_user_cannot_record_payment_on_other_company_invoice(): void
    {
        $clientB = Client::factory()->create(['company_id' => $this->companyB->id]);
        $contractB = Contract::factory()->create(['company_id' => $this->companyB->id, 'client_id' => $clientB->id]);
        $invoiceB = Invoice::factory()->create([
            'company_id' => $this->companyB->id,
            'contract_id' => $contractB->id,
            'amount' => 10000,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->userA)->postJson("/api/invoices/{$invoiceB->id}/payments", [
            'amount' => 5000,
        ]);

        $response->assertStatus(404);
    }

    // ─── Employees ─────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_employees(): void
    {
        $empA = Employee::factory()->create(['company_id' => $this->companyA->id]);
        $empB = Employee::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/employees');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($empA->id, $ids);
        $this->assertNotContains($empB->id, $ids);
    }

    // ─── Tasks ─────────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_tasks(): void
    {
        $taskA = Task::factory()->create(['company_id' => $this->companyA->id, 'created_by' => $this->userA->id]);
        $taskB = Task::factory()->create(['company_id' => $this->companyB->id, 'created_by' => $this->userB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/tasks');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($taskA->id, $ids);
        $this->assertNotContains($taskB->id, $ids);
    }

    public function test_user_cannot_update_other_company_task(): void
    {
        $taskB = Task::factory()->create(['company_id' => $this->companyB->id, 'created_by' => $this->userB->id]);

        $response = $this->actingAs($this->userA)->putJson("/api/tasks/{$taskB->id}", [
            'title' => 'Hacked task',
            'status' => 'done',
        ]);

        $response->assertStatus(404);
    }

    // ─── Expenses ──────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_expenses(): void
    {
        $expA = Expense::factory()->create(['company_id' => $this->companyA->id]);
        $expB = Expense::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/expenses');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($expA->id, $ids);
        $this->assertNotContains($expB->id, $ids);
    }

    // ─── Treasury ──────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_treasury(): void
    {
        TreasuryTransaction::factory()->create(['company_id' => $this->companyA->id]);
        $txnB = TreasuryTransaction::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/treasury');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($txnB->id, $ids);
    }

    // ─── Partners ──────────────────────────────────────────────────

    public function test_user_cannot_see_other_company_partners(): void
    {
        $partnerA = Partner::factory()->create(['company_id' => $this->companyA->id]);
        $partnerB = Partner::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/partners');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($partnerA->id, $ids);
        $this->assertNotContains($partnerB->id, $ids);
    }

    // ─── Notifications ─────────────────────────────────────────────

    public function test_user_cannot_see_other_company_notifications(): void
    {
        Notification::factory()->create(['company_id' => $this->companyA->id, 'user_id' => $this->userA->id]);
        Notification::factory()->create(['company_id' => $this->companyB->id, 'user_id' => $this->userB->id]);

        $response = $this->actingAs($this->userA)->getJson('/api/notifications');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        // notification is user-scoped not just company-scoped
        foreach ($ids as $id) {
            $this->assertDatabaseHas('notifications', ['id' => $id, 'user_id' => $this->userA->id]);
        }
    }

    // ─── Super Admin Cross-Company ─────────────────────────────────

    public function test_super_admin_can_see_all_companies_data(): void
    {
        $superAdmin = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        Client::factory()->create(['company_id' => $this->companyA->id]);
        Client::factory()->create(['company_id' => $this->companyB->id]);

        $response = $this->actingAs($superAdmin)->getJson('/api/clients');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }

    // ─── New Records Auto-Assign company_id ────────────────────────

    public function test_new_client_auto_assigns_company_id(): void
    {
        $response = $this->actingAs($this->userA)->postJson('/api/clients', [
            'name' => 'Test Client',
            'phone' => '01012345678',
            'status' => 'active',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('clients', [
            'name' => 'Test Client',
            'company_id' => $this->companyA->id,
        ]);
    }

    public function test_new_task_auto_assigns_company_id(): void
    {
        $response = $this->actingAs($this->userA)->postJson('/api/tasks', [
            'title' => 'Test Task',
            'priority' => 'high',
            'status' => 'todo',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('tasks', [
            'title' => 'Test Task',
            'company_id' => $this->companyA->id,
        ]);
    }

    // ─── Auth ──────────────────────────────────────────────────────

    public function test_login_returns_token(): void
    {
        $user = User::factory()->create([
            'company_id' => $this->companyA->id,
            'password' => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'company_id' => $this->companyA->id,
            'password' => bcrypt('secret123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(403);
    }

    public function test_wrong_credentials_rejected(): void
    {
        $user = User::factory()->create([
            'company_id' => $this->companyA->id,
            'password' => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    // ─── Role Access ───────────────────────────────────────────────

    public function test_accountant_cannot_access_employees(): void
    {
        $accountant = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'accountant',
            'is_active' => true,
        ]);

        $response = $this->actingAs($accountant)->getJson('/api/employees');

        $response->assertStatus(403);
    }

    public function test_sales_cannot_access_treasury(): void
    {
        $sales = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'sales',
            'is_active' => true,
        ]);

        $response = $this->actingAs($sales)->getJson('/api/treasury');

        $response->assertStatus(403);
    }

    public function test_employee_can_view_clients(): void
    {
        $employee = User::factory()->create([
            'company_id' => $this->companyA->id,
            'role' => 'employee',
            'is_active' => true,
        ]);

        $response = $this->actingAs($employee)->getJson('/api/clients');

        $response->assertStatus(200);
    }
}
