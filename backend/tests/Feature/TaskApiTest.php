<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->company = Company::factory()->create();
        $this->manager = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'manager',
            'is_active' => true,
        ]);
    }

    public function test_manager_can_list_tasks(): void
    {
        Task::factory()->count(3)->create([
            'company_id' => $this->company->id,
            'assigned_to' => $this->manager->id,
            'created_by' => $this->manager->id,
        ]);

        $response = $this->actingAs($this->manager)->getJson('/api/tasks');
        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    public function test_manager_can_create_task(): void
    {
        $assignee = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'employee',
        ]);

        $response = $this->actingAs($this->manager)->postJson('/api/tasks', [
            'title' => 'مهمة اختبار',
            'description' => 'وصف المهمة',
            'assigned_to' => $assignee->id,
            'status' => 'todo',
            'priority' => 'medium',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tasks', ['title' => 'مهمة اختبار']);
    }

    public function test_task_creates_notification_for_assignee(): void
    {
        $assignee = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'employee',
        ]);

        $this->actingAs($this->manager)->postJson('/api/tasks', [
            'title' => 'مهمة إشعار',
            'assigned_to' => $assignee->id,
            'status' => 'todo',
            'priority' => 'medium',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $assignee->id,
            'type' => 'task_assigned',
        ]);
    }

    public function test_employee_can_update_own_task(): void
    {
        $employee = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'employee',
        ]);

        $task = Task::factory()->create([
            'company_id' => $this->company->id,
            'assigned_to' => $employee->id,
            'created_by' => $this->manager->id,
            'status' => 'todo',
        ]);

        $response = $this->actingAs($employee)->putJson("/api/tasks/{$task->id}", [
            'status' => 'in_progress',
        ]);

        $response->assertOk();
        $task->refresh();
        $this->assertEquals('in_progress', $task->status);
    }

    public function test_user_cannot_see_other_company_tasks(): void
    {
        $otherCompany = Company::factory()->create();
        $otherUser = User::factory()->create([
            'company_id' => $otherCompany->id,
            'role' => 'manager',
        ]);

        Task::factory()->create([
            'company_id' => $this->company->id,
            'assigned_to' => $this->manager->id,
            'created_by' => $this->manager->id,
        ]);

        $response = $this->actingAs($otherUser)->getJson('/api/tasks');
        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_manager_can_batch_delete_tasks(): void
    {
        $tasks = Task::factory()->count(3)->create([
            'company_id' => $this->company->id,
            'assigned_to' => $this->manager->id,
            'created_by' => $this->manager->id,
        ]);

        $ids = $tasks->pluck('id')->toArray();
        $response = $this->actingAs($this->manager)->postJson('/api/tasks/batch-delete', [
            'ids' => $ids,
        ]);

        $response->assertOk();
        $this->assertEquals(0, Task::whereIn('id', $ids)->count());
    }
}
