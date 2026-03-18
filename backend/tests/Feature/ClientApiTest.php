<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::factory()->create();
        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'super_admin',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_list_clients(): void
    {
        Client::factory()->count(5)->create(['company_id' => $this->company->id]);

        $response = $this->actingAs($this->admin)->getJson('/api/clients');
        $response->assertOk();
        $this->assertCount(5, $response->json('data'));
    }

    public function test_admin_can_create_client(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/clients', [
            'name' => 'عميل جديد',
            'phone' => '01234567890',
            'company_name' => 'شركة تجريبية',
            'sector' => 'تكنولوجيا',
            'service' => 'تطوير',
            'status' => 'active',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('clients', ['name' => 'عميل جديد']);
    }

    public function test_admin_can_update_client(): void
    {
        $client = Client::factory()->create(['company_id' => $this->company->id]);

        $response = $this->actingAs($this->admin)->putJson("/api/clients/{$client->id}", [
            'name' => 'اسم محدث',
        ]);

        $response->assertOk();
        $client->refresh();
        $this->assertEquals('اسم محدث', $client->name);
    }

    public function test_admin_can_delete_client(): void
    {
        $client = Client::factory()->create(['company_id' => $this->company->id]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/clients/{$client->id}");
        $response->assertOk();
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }

    public function test_employee_cannot_delete_client(): void
    {
        $employee = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'employee',
            'is_active' => true,
        ]);
        $client = Client::factory()->create(['company_id' => $this->company->id]);

        $response = $this->actingAs($employee)->deleteJson("/api/clients/{$client->id}");
        $response->assertForbidden();
    }

    public function test_validation_requires_name(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/clients', [
            'phone' => '01234567890',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('name');
    }
}
