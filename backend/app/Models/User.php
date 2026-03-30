<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, LogsActivity, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'company_id',
        'role', 'permissions', 'phone', 'avatar', 'is_active', 'last_login_at',
        'force_password_change', 'last_announcement_read_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_announcement_read_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'force_password_change' => 'boolean',
            'permissions' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles);
    }

    public function canAccess(string $permission): bool
    {
        if ($this->role === 'super_admin') return true;

        $userPerms = $this->permissions;
        $perms = (is_array($userPerms) && count($userPerms) > 0)
            ? $userPerms
            : self::getDefaultPermissions($this->role);

        // Exact match
        if (in_array($permission, $perms)) return true;

        // Hierarchical: 'tasks' matches 'tasks.view', 'tasks.create', etc.
        foreach ($perms as $p) {
            if (str_starts_with($p, $permission . '.')) return true;
            if (str_contains($permission, '.') && $permission === $p) return true;
        }

        return false;
    }

    public function getEffectivePermissions(): array
    {
        if ($this->role === 'super_admin') {
            return collect(self::getAllPermissions())->flatten()->all();
        }

        $userPerms = $this->permissions;
        if (is_array($userPerms) && count($userPerms) > 0) {
            return $userPerms;
        }

        return self::getDefaultPermissions($this->role);
    }

    public static function getDefaultPermissions(string $role): array
    {
        $defaults = [
            'manager' => [
                'dashboard.view',
                'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
                'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete',
                'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
                'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
                'salaries.view', 'salaries.create',
                'treasury.view', 'treasury.create',
                'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
                'partners.view', 'partners.create', 'partners.edit', 'partners.delete',
                'reports.view',
                'users.view', 'users.create',
                'activity_logs.view',
                'settings.view', 'settings.edit',
            ],
            'accountant' => [
                'dashboard.view',
                'clients.view',
                'contracts.view',
                'invoices.view', 'invoices.create', 'invoices.edit',
                'employees.view',
                'salaries.view', 'salaries.create',
                'treasury.view', 'treasury.create',
                'expenses.view', 'expenses.create', 'expenses.edit',
                'tasks.view', 'tasks.create', 'tasks.edit',
                'reports.view',
                'settings.view',
            ],
            'sales' => [
                'dashboard.view',
                'clients.view', 'clients.create', 'clients.edit',
                'contracts.view', 'contracts.create',
                'invoices.view', 'invoices.create',
                'tasks.view', 'tasks.create', 'tasks.edit',
                'settings.view',
            ],
            'marketing_manager' => [
                'dashboard.view',
                'clients.view',
                'employees.view',
                'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
                'reports.view',
                'settings.view',
            ],
            'company_admin' => [
                'dashboard.view',
                'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
                'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete',
                'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
                'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
                'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
                'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
                'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
                'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
                'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete',
                'tickets.view', 'tickets.create', 'tickets.edit',
                'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete',
                'calendar.view',
                'file_manager.view', 'file_manager.create', 'file_manager.edit', 'file_manager.delete',
                'leaves.view', 'leaves.create', 'leaves.approve',
                'attendance.view', 'attendance.create',
                'kpi.view',
                'announcements.view',
                'chat.view',
                'reports.view',
                'users.view', 'users.create', 'users.edit',
                'activity_logs.view',
                'settings.view', 'settings.edit',
            ],
            'employee' => [
                'dashboard.view',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
                'projects.view', 'projects.create', 'projects.edit',
                'calendar.view',
                'meetings.view',
                'attendance.view', 'attendance.create',
                'leaves.view', 'leaves.create',
                'kpi.view',
                'announcements.view',
                'chat.view',
                'file_manager.view', 'file_manager.create',
            ],
        ];
        return $defaults[$role] ?? [];
    }

    public static function getAllPermissions(): array
    {
        return [
            'dashboard' => ['dashboard.view'],
            'clients' => ['clients.view', 'clients.create', 'clients.edit', 'clients.delete'],
            'contracts' => ['contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete'],
            'invoices' => ['invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete'],
            'quotations' => ['quotations.view', 'quotations.create', 'quotations.edit', 'quotations.delete'],
            'projects' => ['projects.view', 'projects.create', 'projects.edit', 'projects.delete'],
            'employees' => ['employees.view', 'employees.create', 'employees.edit', 'employees.delete'],
            'salaries' => ['salaries.view', 'salaries.create'],
            'treasury' => ['treasury.view', 'treasury.create'],
            'expenses' => ['expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete'],
            'tasks' => ['tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete'],
            'sales' => ['sales.view', 'sales.create', 'sales.edit', 'sales.delete'],
            'leads' => ['leads.view', 'leads.create', 'leads.edit', 'leads.delete'],
            'tickets' => ['tickets.view', 'tickets.create', 'tickets.edit'],
            'meetings' => ['meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete'],
            'calendar' => ['calendar.view'],
            'file_manager' => ['file_manager.view', 'file_manager.create', 'file_manager.edit', 'file_manager.delete'],
            'leaves' => ['leaves.view', 'leaves.create', 'leaves.approve'],
            'attendance' => ['attendance.view', 'attendance.create'],
            'kpi' => ['kpi.view'],
            'announcements' => ['announcements.view'],
            'chat' => ['chat.view'],
            'partners' => ['partners.view', 'partners.create', 'partners.edit', 'partners.delete'],
            'reports' => ['reports.view'],
            'users' => ['users.view', 'users.create', 'users.edit', 'users.delete'],
            'activity_logs' => ['activity_logs.view'],
            'settings' => ['settings.view', 'settings.edit'],
        ];
    }

    public static function getPermissionLabels(): array
    {
        return [
            'dashboard' => 'لوحة التحكم',
            'clients' => 'العملاء',
            'contracts' => 'العقود',
            'invoices' => 'الفواتير',
            'quotations' => 'عروض الأسعار',
            'projects' => 'المشاريع',
            'employees' => 'الموظفين',
            'salaries' => 'الرواتب',
            'treasury' => 'الخزينة',
            'expenses' => 'المصروفات',
            'tasks' => 'المهام',
            'sales' => 'المبيعات',
            'leads' => 'العملاء المحتملين',
            'tickets' => 'تذاكر الدعم',
            'meetings' => 'الاجتماعات',
            'calendar' => 'التقويم',
            'file_manager' => 'مدير الملفات',
            'leaves' => 'الإجازات',
            'attendance' => 'الحضور والانصراف',
            'kpi' => 'لوحة الأداء',
            'announcements' => 'الإعلانات',
            'chat' => 'المحادثات',
            'partners' => 'الشركاء',
            'reports' => 'التقارير',
            'users' => 'المستخدمين',
            'activity_logs' => 'سجل النشاطات',
            'settings' => 'الإعدادات',
        ];
    }

    public static function getActionLabels(): array
    {
        return [
            'view' => 'عرض',
            'create' => 'إضافة',
            'edit' => 'تعديل',
            'delete' => 'حذف',
        ];
    }
}
