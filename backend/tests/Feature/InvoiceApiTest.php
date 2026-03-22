<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $admin;
    private Client $client;
    private Contract $contract;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::factory()->create();
        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'super_admin',
            'is_active' => true,
        ]);
        $this->client = Client::factory()->create(['company_id' => $this->company->id]);
        $this->contract = Contract::factory()->create([
            'company_id' => $this->company->id,
            'client_id' => $this->client->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_list_invoices(): void
    {
        Invoice::factory()->count(3)->create([
            'company_id' => $this->company->id,
            'contract_id' => $this->contract->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/invoices');
        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_create_invoice(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/invoices', [
            'contract_id' => $this->contract->id,
            'amount' => 5000,
            'currency' => 'EGP',
            'due_date' => now()->addMonth()->toDateString(),
            'is_paid' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('invoices', [
            'contract_id' => $this->contract->id,
            'amount' => 5000,
        ]);
    }

    public function test_admin_can_record_payment(): void
    {
        $invoice = Invoice::factory()->create([
            'company_id' => $this->company->id,
            'contract_id' => $this->contract->id,
            'amount' => 10000,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/invoices/{$invoice->id}/pay", [
            'amount' => 5000,
            'notes' => 'دفعة أولى',
        ]);

        $response->assertOk();
        $invoice->refresh();
        $this->assertEquals('partial', $invoice->status);
    }

    public function test_employee_cannot_create_invoice(): void
    {
        $employee = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'employee',
            'is_active' => true,
        ]);

        $response = $this->actingAs($employee)->postJson('/api/invoices', [
            'contract_id' => $this->contract->id,
            'amount' => 5000,
            'due_date' => now()->addMonth()->toDateString(),
        ]);

        $response->assertForbidden();
    }

    public function test_user_cannot_see_other_company_invoices(): void
    {
        $otherCompany = Company::factory()->create();
        $otherUser = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role' => 'super_admin',
        ]);
        $otherClient = Client::factory()->create(['company_id' => $otherCompany->id]);
        $otherContract = Contract::factory()->create([
            'company_id' => $otherCompany->id,
            'client_id' => $otherClient->id,
        ]);

        Invoice::factory()->create([
            'company_id' => $this->company->id,
            'contract_id' => $this->contract->id,
        ]);
        Invoice::factory()->create([
            'company_id' => $otherCompany->id,
            'contract_id' => $otherContract->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/invoices');
        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_invoice_created_as_pending_by_default(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/invoices', [
            'contract_id' => $this->contract->id,
            'amount' => 3000,
            'currency' => 'EGP',
            'due_date' => now()->addMonth()->toDateString(),
        ]);

        $response->assertStatus(201);
        $invoice = Invoice::latest()->first();
        $this->assertEquals('pending', $invoice->status);
        $this->assertNull($invoice->paid_date);
        $this->assertEquals(0, $invoice->payments()->count());
    }

    public function test_invoice_created_as_paid_when_is_paid_true(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/invoices', [
            'contract_id' => $this->contract->id,
            'amount' => 3000,
            'currency' => 'EGP',
            'due_date' => now()->addMonth()->toDateString(),
            'is_paid' => true,
        ]);

        $response->assertStatus(201);
        $invoice = Invoice::latest()->first();
        $this->assertEquals('paid', $invoice->status);
        $this->assertNotNull($invoice->paid_date);
        $this->assertEquals(1, $invoice->payments()->count());
    }

    public function test_admin_can_batch_delete_invoices(): void
    {
        $invoices = Invoice::factory()->count(3)->create([
            'company_id' => $this->company->id,
            'contract_id' => $this->contract->id,
        ]);

        $ids = $invoices->pluck('id')->toArray();
        $response = $this->actingAs($this->admin)->postJson('/api/invoices/batch-delete', [
            'ids' => $ids,
        ]);

        $response->assertOk();
        $this->assertEquals(0, Invoice::whereIn('id', $ids)->count());
    }
}
