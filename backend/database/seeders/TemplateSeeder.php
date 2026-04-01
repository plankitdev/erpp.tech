<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Template;
use App\Models\TemplateCategory;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::all();

        foreach ($companies as $company) {
            $this->seedForCompany($company->id);
        }
    }

    private function seedForCompany(int $companyId): void
    {
        // Skip if already seeded
        if (TemplateCategory::withoutGlobalScopes()->where('company_id', $companyId)->exists()) {
            return;
        }

        // Categories
        $categories = [
            ['name' => 'Marketing', 'slug' => 'marketing', 'color' => '#D85A30', 'icon' => 'megaphone', 'sort_order' => 1],
            ['name' => 'Sales',     'slug' => 'sales',     'color' => '#2563EB', 'icon' => 'target',    'sort_order' => 2],
            ['name' => 'Content',   'slug' => 'content',   'color' => '#639922', 'icon' => 'pen-tool',  'sort_order' => 3],
            ['name' => 'Development', 'slug' => 'development', 'color' => '#7C3AED', 'icon' => 'code', 'sort_order' => 4],
        ];

        $catMap = [];
        foreach ($categories as $cat) {
            $catMap[$cat['slug']] = TemplateCategory::create(array_merge($cat, ['company_id' => $companyId]))->id;
        }

        // Templates
        $templates = [
            // 1. Content Plan
            [
                'category_id'     => $catMap['content'],
                'name'            => 'Content Plan — شهري',
                'description'     => 'خطة محتوى شهرية شاملة للمنصات الرقمية',
                'thumbnail_color' => '#639922',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'duration', 'label' => 'المدة', 'type' => 'number', 'default' => 30, 'unit' => 'يوم', 'required' => true],
                        ['key' => 'posts_count', 'label' => 'عدد البوستات', 'type' => 'number', 'default' => 12],
                        ['key' => 'channels', 'label' => 'القنوات', 'type' => 'multi_select', 'options' => ['Facebook', 'Instagram', 'TikTok', 'LinkedIn'], 'default' => ['Facebook', 'Instagram']],
                        ['key' => 'goals', 'label' => 'الأهداف', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'target_audience', 'label' => 'الجمهور المستهدف', 'type' => 'text', 'default' => ''],
                        ['key' => 'budget', 'label' => 'الميزانية', 'type' => 'currency', 'default' => 0, 'currency' => 'EGP'],
                        ['key' => 'notes', 'label' => 'ملاحظات', 'type' => 'textarea', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'معلومات أساسية', 'fields' => ['duration', 'posts_count', 'channels']],
                        ['title' => 'التفاصيل', 'fields' => ['goals', 'target_audience', 'budget', 'notes']],
                    ],
                ],
            ],
            // 2. Content Calendar
            [
                'category_id'     => $catMap['content'],
                'name'            => 'Content Calendar',
                'description'     => 'تقويم محتوى أسبوعي مع توزيع على المنصات',
                'thumbnail_color' => '#16A34A',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'week_start', 'label' => 'بداية الأسبوع', 'type' => 'date', 'default' => null, 'required' => true],
                        ['key' => 'platforms', 'label' => 'المنصات', 'type' => 'multi_select', 'options' => ['Facebook', 'Instagram', 'TikTok', 'Twitter', 'LinkedIn'], 'default' => ['Facebook', 'Instagram']],
                        ['key' => 'content_type', 'label' => 'نوع المحتوى', 'type' => 'multi_select', 'options' => ['بوست', 'ريلز', 'ستوري', 'كاروسيل', 'فيديو'], 'default' => ['بوست']],
                        ['key' => 'daily_posts', 'label' => 'عدد البوستات يومياً', 'type' => 'number', 'default' => 1],
                        ['key' => 'theme', 'label' => 'ثيم الأسبوع', 'type' => 'text', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'الإعدادات', 'fields' => ['week_start', 'platforms', 'content_type']],
                        ['title' => 'التفاصيل', 'fields' => ['daily_posts', 'theme']],
                    ],
                ],
            ],
            // 3. Media Plan
            [
                'category_id'     => $catMap['marketing'],
                'name'            => 'Media Plan',
                'description'     => 'خطة ميديا إعلانية مع توزيع الميزانية والـ KPIs',
                'thumbnail_color' => '#D85A30',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'campaign_name', 'label' => 'اسم الحملة', 'type' => 'text', 'required' => true, 'default' => ''],
                        ['key' => 'start_date', 'label' => 'تاريخ البداية', 'type' => 'date', 'default' => null],
                        ['key' => 'end_date', 'label' => 'تاريخ النهاية', 'type' => 'date', 'default' => null],
                        ['key' => 'platforms', 'label' => 'المنصات', 'type' => 'multi_select', 'options' => ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Snapchat', 'YouTube'], 'default' => ['Meta Ads']],
                        ['key' => 'total_budget', 'label' => 'إجمالي الميزانية', 'type' => 'currency', 'default' => 0, 'currency' => 'EGP'],
                        ['key' => 'budget_split', 'label' => 'توزيع الميزانية', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'objective', 'label' => 'الهدف الإعلاني', 'type' => 'select', 'options' => ['Awareness', 'Traffic', 'Engagement', 'Leads', 'Conversions'], 'default' => 'Leads'],
                        ['key' => 'target_audience', 'label' => 'الجمهور المستهدف', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'kpi_target', 'label' => 'KPI المستهدف', 'type' => 'text', 'default' => ''],
                        ['key' => 'notes', 'label' => 'ملاحظات', 'type' => 'textarea', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'معلومات الحملة', 'fields' => ['campaign_name', 'start_date', 'end_date']],
                        ['title' => 'المنصات والميزانية', 'fields' => ['platforms', 'total_budget', 'budget_split']],
                        ['title' => 'الأهداف', 'fields' => ['objective', 'target_audience', 'kpi_target', 'notes']],
                    ],
                ],
            ],
            // 4. Campaign Brief (الكامل)
            [
                'category_id'     => $catMap['marketing'],
                'name'            => 'Campaign Brief',
                'description'     => 'ملخص حملة إعلانية شامل — 21 حقل، 6 أقسام',
                'thumbnail_color' => '#DC2626',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'campaign_name', 'label' => 'اسم الحملة', 'type' => 'text', 'required' => true, 'default' => ''],
                        ['key' => 'client_name', 'label' => 'اسم العميل', 'type' => 'text', 'required' => true, 'default' => ''],
                        ['key' => 'campaign_owner', 'label' => 'المسؤول عن الحملة', 'type' => 'text', 'default' => ''],
                        ['key' => 'start_date', 'label' => 'تاريخ البداية', 'type' => 'date', 'default' => null],
                        ['key' => 'end_date', 'label' => 'تاريخ النهاية', 'type' => 'date', 'default' => null],
                        ['key' => 'campaign_objective', 'label' => 'هدف الحملة الرئيسي', 'type' => 'select', 'required' => true, 'options' => ['Brand Awareness', 'Lead Generation', 'Conversions', 'Traffic', 'Engagement', 'App Installs'], 'default' => null],
                        ['key' => 'target_audience', 'label' => 'الجمهور المستهدف', 'type' => 'textarea', 'required' => true, 'default' => ''],
                        ['key' => 'usp', 'label' => 'Unique Selling Point', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'platforms', 'label' => 'المنصات الإعلانية', 'type' => 'multi_select', 'required' => true, 'options' => ['Meta Ads', 'Instagram', 'TikTok Ads', 'Google Ads', 'YouTube', 'Snapchat'], 'default' => []],
                        ['key' => 'total_budget', 'label' => 'إجمالي الميزانية', 'type' => 'currency', 'currency' => 'EGP', 'default' => 0],
                        ['key' => 'budget_split', 'label' => 'توزيع الميزانية', 'type' => 'select', 'options' => ['Meta 70% / Google 30%', 'Meta 60% / TikTok 40%', 'موزع بالتساوي', 'Custom'], 'default' => null],
                        ['key' => 'kpi_leads', 'label' => 'عدد الليدز المستهدف', 'type' => 'number', 'unit' => 'ليد', 'default' => 0],
                        ['key' => 'kpi_cpl', 'label' => 'أقصى CPL مقبول', 'type' => 'currency', 'currency' => 'EGP', 'default' => 0],
                        ['key' => 'kpi_roas', 'label' => 'ROAS المستهدف', 'type' => 'number', 'unit' => 'x', 'default' => 0],
                        ['key' => 'kpi_ctr', 'label' => 'نسبة CTR المستهدفة', 'type' => 'number', 'unit' => '%', 'default' => 0],
                        ['key' => 'kpi_impressions', 'label' => 'Impressions المستهدفة', 'type' => 'number', 'default' => 0],
                        ['key' => 'creative_types', 'label' => 'أنواع الكريتيف', 'type' => 'multi_select', 'options' => ['فيديو 15 ث', 'كاروسيل', 'Static Image', 'Stories', 'Reels', 'UGC'], 'default' => []],
                        ['key' => 'main_message', 'label' => 'الرسالة الرئيسية', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'content_tone', 'label' => 'لهجة المحتوى', 'type' => 'select', 'options' => ['Inspiring — ملهم', 'Friendly — ودود', 'Professional — احترافي', 'Urgent — استعجالي'], 'default' => null],
                        ['key' => 'cta', 'label' => 'الـ CTA الرئيسي', 'type' => 'select', 'options' => ['اشتري دلوقتي', 'تواصلي معنا', 'سجلي بياناتك', 'اعرفي أكتر'], 'default' => null],
                        ['key' => 'notes', 'label' => 'ملاحظات إضافية', 'type' => 'textarea', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'معلومات أساسية', 'fields' => ['campaign_name', 'client_name', 'campaign_owner', 'start_date', 'end_date']],
                        ['title' => 'الهدف والجمهور', 'fields' => ['campaign_objective', 'target_audience', 'usp']],
                        ['title' => 'المنصات والميزانية', 'fields' => ['platforms', 'total_budget', 'budget_split']],
                        ['title' => 'الـ KPIs', 'fields' => ['kpi_leads', 'kpi_cpl', 'kpi_roas', 'kpi_ctr', 'kpi_impressions']],
                        ['title' => 'الكريتيف والمحتوى', 'fields' => ['creative_types', 'main_message', 'content_tone', 'cta']],
                        ['title' => 'ملاحظات', 'fields' => ['notes']],
                    ],
                ],
            ],
            // 5. Sales Funnel
            [
                'category_id'     => $catMap['sales'],
                'name'            => 'Sales Funnel',
                'description'     => 'قمع مبيعات مع مراحل واضحة وأهداف لكل مرحلة',
                'thumbnail_color' => '#2563EB',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'funnel_name', 'label' => 'اسم الـ Funnel', 'type' => 'text', 'required' => true, 'default' => ''],
                        ['key' => 'stages', 'label' => 'المراحل', 'type' => 'multi_select', 'options' => ['Awareness', 'Interest', 'Consideration', 'Intent', 'Purchase'], 'default' => ['Awareness', 'Interest', 'Consideration', 'Intent', 'Purchase']],
                        ['key' => 'target_leads', 'label' => 'عدد الليدز المستهدف', 'type' => 'number', 'default' => 100],
                        ['key' => 'conversion_target', 'label' => 'نسبة التحويل المستهدفة', 'type' => 'number', 'unit' => '%', 'default' => 10],
                        ['key' => 'timeline', 'label' => 'المدة الزمنية', 'type' => 'text', 'default' => ''],
                        ['key' => 'criteria', 'label' => 'معايير التأهيل', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'notes', 'label' => 'ملاحظات', 'type' => 'textarea', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'إعداد الـ Funnel', 'fields' => ['funnel_name', 'stages', 'timeline']],
                        ['title' => 'الأهداف والمعايير', 'fields' => ['target_leads', 'conversion_target', 'criteria', 'notes']],
                    ],
                ],
            ],
            // 6. Client Onboarding
            [
                'category_id'     => $catMap['sales'],
                'name'            => 'Client Onboarding',
                'description'     => 'خطة استقبال عميل جديد مع المهام والمسؤوليات',
                'thumbnail_color' => '#0891B2',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'client_name', 'label' => 'اسم العميل', 'type' => 'text', 'required' => true, 'default' => ''],
                        ['key' => 'service', 'label' => 'الخدمة', 'type' => 'text', 'default' => ''],
                        ['key' => 'start_date', 'label' => 'تاريخ البداية', 'type' => 'date', 'default' => null],
                        ['key' => 'weeks', 'label' => 'عدد أسابيع الـ Onboarding', 'type' => 'number', 'default' => 2],
                        ['key' => 'responsible', 'label' => 'المسؤول', 'type' => 'text', 'default' => ''],
                        ['key' => 'checklist', 'label' => 'قائمة المهام', 'type' => 'textarea', 'default' => "1. تسليم البيانات\n2. إعداد الحسابات\n3. اجتماع kickoff\n4. بداية العمل"],
                        ['key' => 'notes', 'label' => 'ملاحظات', 'type' => 'textarea', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'بيانات العميل', 'fields' => ['client_name', 'service', 'start_date']],
                        ['title' => 'خطة الـ Onboarding', 'fields' => ['weeks', 'responsible', 'checklist', 'notes']],
                    ],
                ],
            ],
            // 7. Sprint Plan
            [
                'category_id'     => $catMap['development'],
                'name'            => 'Sprint Plan',
                'description'     => 'خطة سبرنت مع المهام والنقاط والمسؤوليات',
                'thumbnail_color' => '#7C3AED',
                'is_default'      => true,
                'schema'          => [
                    'fields' => [
                        ['key' => 'sprint_name', 'label' => 'اسم السبرنت', 'type' => 'text', 'required' => true, 'default' => ''],
                        ['key' => 'start_date', 'label' => 'تاريخ البداية', 'type' => 'date', 'default' => null],
                        ['key' => 'end_date', 'label' => 'تاريخ النهاية', 'type' => 'date', 'default' => null],
                        ['key' => 'total_points', 'label' => 'إجمالي النقاط', 'type' => 'number', 'default' => 0],
                        ['key' => 'tasks', 'label' => 'المهام', 'type' => 'textarea', 'default' => ''],
                        ['key' => 'responsible', 'label' => 'الفريق المسؤول', 'type' => 'text', 'default' => ''],
                        ['key' => 'sprint_goal', 'label' => 'هدف السبرنت', 'type' => 'textarea', 'default' => ''],
                    ],
                    'sections' => [
                        ['title' => 'معلومات السبرنت', 'fields' => ['sprint_name', 'start_date', 'end_date', 'total_points']],
                        ['title' => 'المهام والأهداف', 'fields' => ['tasks', 'responsible', 'sprint_goal']],
                    ],
                ],
            ],
        ];

        foreach ($templates as $tmpl) {
            Template::create(array_merge($tmpl, [
                'company_id' => $companyId,
                'is_locked'  => true,
            ]));
        }
    }
}
