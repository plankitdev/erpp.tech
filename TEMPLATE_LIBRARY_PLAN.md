# خطة مكتبة التيمبليتس (Template Library) — PlanKit ERP

---

## 1. الوضع الحالي (ما عندنا دلوقتي)

### ✅ موجود بالفعل:
| العنصر | الوصع | التفاصيل |
|--------|------|----------|
| جدول `file_templates` | موجود | يخزن ملفات فعلية (PDF, DOCX) مش JSON Schema |
| `FileTemplate` Model | موجود | `name, category, file_path, file_type, file_size` |
| `FileTemplateController` | موجود | CRUD بسيط (index, store, update, destroy) — بدون `show` |
| API Routes | موجود | `GET/POST/PUT/DELETE /file-templates` — role: super_admin, manager |
| صفحة `FileTemplates.tsx` | موجودة | عرض grid + رفع ملف + حذف + فلترة بالتصنيف |
| Hook + API Client | موجود | `useFileTemplates`, `fileTemplatesApi` |
| التصنيفات الحالية | 6 | `invoice, contract, plan, proposal, report, other` |

### ❌ مش موجود:
| العنصر | ملاحظة |
|--------|--------|
| JSON Schema للتيمبليت | التيمبليتس حالياً مجرد ملفات مرفوعة |
| جدول `template_categories` | التصنيفات hardcoded في الكود |
| جدول `user_documents` | مفيش مكان يتحفظ فيه "الدوكيومنت اللي اليوزر عمله من تيمبليت" |
| معاينة (Preview) | مفيش modal معاينة بعرض محتوى التيمبليت |
| زرار "استخدم" (Use Template) | مفيش workflow لتحويل التيمبليت لدوكيومنت خاص |
| محرر (Editor) | مفيش صفحة لتعديل الدوكيومنت بعد إنشائه |
| نسخ (Duplicate) | مفيش خاصية نسخ تيمبليت موجود |

---

## 2. الفكرة المطلوبة

### الـ Workflow الكامل:
```
📚 مكتبة التيمبليتس → 👁️ معاينة → ✅ استخدم (نسخة) → 📝 محرر → 💾 حفظ → 📁 يتحفظ في File Manager → ☁️ يتسنك مع Google Drive
```

### القواعد الأساسية (Template Protection):
| القاعدة | التفاصيل |
|---------|----------|
| **التيمبليت الأصلي read-only** | اليوزر العادي مش بيعدل على التيمبليت — بياخد نسخة بس |
| **Copy-on-Use** | لما يضغط "استخدم"، بيتعمل deep copy من الـ schema في `user_documents` — التيمبليت الأصلي مش بيتأثر أبداً |
| **Schema Snapshot** | الدوكيومنت بيحفظ نسخة كاملة من الـ schema وقت الإنشاء — لو التيمبليت اتعدل بعدين اليوزر بتاعته مش بتتأثر |
| **الحفظ في الـ Drive** | كل دوكيومنت بيتحفظ كملف في File Manager (مجلد "مستندات التيمبليتس") اللي بيتسنك مع Google Drive أوتوماتيك |
| **صلاحيات التيمبليت** | التعديل على التيمبليت الأصلي = `super_admin` و `manager` بس |
| **Duplicate** | الأدمن يقدر ينسخ تيمبليت موجود ويعدله — بدل ما يعمل واحد من الصفر |

### 3 جداول في الداتابيز:
```
template_categories    →  أقسام التيمبليتس (Marketing, Sales, Content, Dev)
templates              →  التيمبليت نفسه + JSON Schema + الوصف + category_id (🔒 read-only للـ users)
user_documents         →  الدوكيومنت اللي اليوزر عمله (نسخة) + مربوط بـ File Manager
```

---

## 3. تحليل الفجوة — إيه اللي محتاج يتغير

### السيناريو: بناء النظام الجديد بالتوازي مع القديم

الحل الأفضل هو **إضافة نظام جديد بجانب القديم** بدون حذف أي كود قائم. النظام القديم (`file_templates`) يظل يشتغل لرفع القوالب الفعلية (PDF/DOCX)، والنظام الجديد يبقى مكتبة تيمبليتس ذكية بـ JSON Schema.

---

## 4. خطة التنفيذ التفصيلية

### المرحلة 1: الداتابيز (Backend — Migrations)

#### جدول `template_categories`
```
id               - PK
company_id       - FK → companies (multi-tenant)
name             - string (مثلاً: Marketing, Sales, Content)
slug             - string unique per company
color            - string (#D85A30)
icon             - string nullable (اسم الأيقونة)
sort_order       - integer default 0
created_at
updated_at
```

#### جدول `templates`
```
id               - PK
company_id       - FK → companies
category_id      - FK → template_categories
name             - string (مثلاً: Content Plan — شهري)
description      - text nullable
schema           - JSON (الـ JSON Schema بتاع الحقول)
preview_data     - JSON nullable (بيانات المعاينة — القيم اللي بتظهر في الـ Preview)
thumbnail_color  - string nullable (#639922)
is_default       - boolean default false (التيمبليتس اللي بتيجي مع النظام)
is_locked        - boolean default true (🔒 ممنوع التعديل من اليوزر العادي)
usage_count      - integer default 0
created_by       - FK → users nullable
created_at
updated_at
```

**مثال على الـ `schema` JSON:**
```json
{
  "fields": [
    { "key": "duration", "label": "المدة", "type": "number", "default": 30, "unit": "يوم" },
    { "key": "posts_count", "label": "عدد البوستات", "type": "number", "default": 12 },
    { "key": "channels", "label": "القنوات", "type": "multi_select", "options": ["Facebook", "Instagram", "TikTok", "LinkedIn"], "default": ["Facebook", "Instagram"] },
    { "key": "goals", "label": "الأهداف", "type": "textarea", "default": "" },
    { "key": "target_audience", "label": "الجمهور المستهدف", "type": "text", "default": "" },
    { "key": "budget", "label": "الميزانية", "type": "currency", "default": 0 },
    { "key": "notes", "label": "ملاحظات", "type": "textarea", "default": "" }
  ],
  "sections": [
    { "title": "معلومات أساسية", "fields": ["duration", "posts_count", "channels"] },
    { "title": "التفاصيل", "fields": ["goals", "target_audience", "budget", "notes"] }
  ]
}
```

#### جدول `user_documents`
```
id               - PK
company_id       - FK → companies
user_id          - FK → users (صاحب الدوكيومنت)
template_id      - FK → templates nullable (مرجع للتيمبليت الأصلي — للإحصائيات فقط)
title            - string
schema_snapshot  - JSON (📸 نسخة كاملة من الـ schema وقت الإنشاء — مستقلة عن التيمبليت الأصلي)
data             - JSON (البيانات اللي اليوزر ملاها)
status           - enum: draft, completed, archived
folder_id        - FK → folders nullable (📁 المجلد في File Manager اللي اتحفظ فيه)
managed_file_id  - FK → managed_files nullable (📄 الملف المولّد في File Manager)
project_id       - FK → projects nullable (لو مربوط بمشروع)
client_id        - FK → clients nullable (لو مربوط بعميل)
created_at
updated_at
```

**ليه `schema_snapshot`؟**
> لأن التيمبليت الأصلي ممكن يتعدل أو يتحذف — اليوزر لازم الدوكيومنت بتاعه يفضل شغال بالـ schema اللي كان موجود وقت ما عمل النسخة. ده بيخلي الـ `template_id` مرجع اختياري مش dependency.

---

### المرحلة 2: الـ Backend (Models + Controllers + Routes)

#### Models (3 ملفات):
1. `TemplateCategory` — HasCompany, relations: templates
2. `Template` — HasCompany, relations: category, creator, userDocuments
   - **`is_locked` = true** → ممنوع التعديل من اليوزر العادي (بس admin/manager)
3. `UserDocument` — HasCompany, relations: user, template, project, client, folder, managedFile

#### Controllers (3 ملفات):
1. **`TemplateCategoryController`** — CRUD للأقسام
2. **`TemplateLibraryController`**:
   - `index()` — عرض كل التيمبليتس مع فلترة بالـ category
   - `show($id)` — تفاصيل التيمبليت مع الـ schema كامل (المعاينة)
   - `store()` — إنشاء تيمبليت جديد (admin/manager فقط)
   - `update()` — تعديل تيمبليت (admin/manager فقط — والتيمبليت مش locked أو يفك الـ lock الأول)
   - `destroy()` — حذف تيمبليت (admin فقط)
   - `useTemplate($id)` — ✨ **إنشاء user_document من التيمبليت (Copy-on-Use)**
     - ياخد نسخة من الـ schema → يحفظها في `schema_snapshot`
     - يملأ الـ data بالـ default values من الـ schema
     - يزوّد `usage_count` على التيمبليت الأصلي
     - يعمل فولدر في File Manager لو مش موجود
   - `duplicate($id)` — نسخ تيمبليت موجود (admin/manager)

3. **`UserDocumentController`**:
   - `index()` — عرض دوكيومنتس اليوزر الحالي
   - `show($id)` — عرض دوكيومنت واحد (بالـ schema_snapshot — مش بالتيمبليت الأصلي)
   - `update($id)` — تحديث البيانات (JSON data)
   - `updateStatus($id)` — تغيير الحالة (draft → completed → archived)
   - `saveToFileManager($id)` — ✨ **حفظ الدوكيومنت كملف في File Manager + Drive sync**
   - `destroy($id)` — حذف
   - `export($id)` — تصدير كـ PDF (مستقبلاً)

#### 🔑 `useTemplate()` Logic (الكود الأهم):
```php
public function useTemplate(Template $template)
{
    // 1. Deep copy the schema (snapshot) — مش reference
    $schemaSnapshot = $template->schema; // JSON copy, مش pointer
    
    // 2. Build default data from schema fields
    $defaultData = [];
    foreach ($schemaSnapshot['fields'] as $field) {
        $defaultData[$field['key']] = $field['default'] ?? null;
    }
    
    // 3. Create the user document
    $document = UserDocument::create([
        'company_id'      => auth()->user()->company_id,
        'user_id'         => auth()->id(),
        'template_id'     => $template->id,        // مرجع اختياري
        'title'           => $template->name,       // اليوزر يقدر يغيره بعدين
        'schema_snapshot' => $schemaSnapshot,        // 📸 النسخة المستقلة
        'data'            => $defaultData,           // القيم الافتراضية
        'status'          => 'draft',
    ]);
    
    // 4. Increment usage count
    $template->increment('usage_count');
    
    return $document;
}
```

#### 🔑 `saveToFileManager()` Logic:
```php
public function saveToFileManager(UserDocument $document)
{
    // 1. Find or create "مستندات التيمبليتس" folder
    $folder = Folder::firstOrCreate([
        'company_id' => $document->company_id,
        'name'       => 'مستندات التيمبليتس',
        'type'       => 'general',
        'parent_id'  => null,
    ]);
    
    // 2. Generate file (JSON or PDF)
    $fileName = $document->title . ' — ' . now()->format('Y-m-d') . '.json';
    $filePath = 'documents/' . $document->company_id . '/' . $fileName;
    Storage::put($filePath, json_encode($document->data, JSON_UNESCAPED_UNICODE));
    
    // 3. Create ManagedFile record
    $managedFile = ManagedFile::create([
        'company_id'  => $document->company_id,
        'folder_id'   => $folder->id,
        'name'        => $fileName,
        'file_path'   => $filePath,
        'mime_type'   => 'application/json',
        'file_size'   => Storage::size($filePath),
        'status'      => 'approved',
        'uploaded_by' => $document->user_id,
    ]);
    
    // 4. Sync to Google Drive (automatic via GoogleDriveService)
    $driveService = GoogleDriveService::forCompany($document->company_id);
    if ($driveService) {
        $driveFolderId = $driveService->resolveParentDriveFolderId($folder->id);
        $driveFileId = $driveService->uploadFile($filePath, $fileName, $driveFolderId);
        if ($driveFileId) {
            $managedFile->update(['drive_file_id' => $driveFileId]);
        }
    }
    
    // 5. Link document to file
    $document->update([
        'folder_id'       => $folder->id,
        'managed_file_id' => $managedFile->id,
        'status'          => 'completed',
    ]);
    
    return $document->load('managedFile');
}
```

#### Routes (في `api.php`):
```php
// Template Library
Route::prefix('template-library')->group(function () {
    Route::get('categories', [TemplateCategoryController::class, 'index']);
    Route::get('/', [TemplateLibraryController::class, 'index']);
    Route::get('/{template}', [TemplateLibraryController::class, 'show']);
    Route::post('/{template}/use', [TemplateLibraryController::class, 'useTemplate']);

    // Admin only
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::post('/', [TemplateLibraryController::class, 'store']);
        Route::put('/{template}', [TemplateLibraryController::class, 'update']);
        Route::delete('/{template}', [TemplateLibraryController::class, 'destroy']);
        Route::post('/{template}/duplicate', [TemplateLibraryController::class, 'duplicate']);
        Route::apiResource('categories', TemplateCategoryController::class)->except(['index']);
    });
});

// User Documents
Route::prefix('user-documents')->group(function () {
    Route::get('/', [UserDocumentController::class, 'index']);
    Route::get('/{document}', [UserDocumentController::class, 'show']);
    Route::put('/{document}', [UserDocumentController::class, 'update']);
    Route::put('/{document}/status', [UserDocumentController::class, 'updateStatus']);
    Route::post('/{document}/save-to-drive', [UserDocumentController::class, 'saveToFileManager']); // 📁 حفظ في File Manager + Drive
    Route::delete('/{document}', [UserDocumentController::class, 'destroy']);
    Route::get('/{document}/export', [UserDocumentController::class, 'export']); // مستقبلاً: PDF
});
```

---

### المرحلة 3: الـ Frontend

#### ملفات جديدة:
| ملف | الغرض |
|-----|------|
| `api/templateLibrary.ts` | API client للتيمبليتس الجديدة |
| `api/userDocuments.ts` | API client للدوكيومنتس (بما فيهم `saveToFileManager`) |
| `hooks/useTemplateLibrary.ts` | React Query hooks |
| `hooks/useUserDocuments.ts` | React Query hooks |
| `pages/TemplateLibrary.tsx` | **الصفحة الرئيسية** — المكتبة بالـ sidebar + grid + search |
| `pages/TemplatePreview.tsx` | **صفحة/modal المعاينة** — عرض الـ schema والحقول + بيانات تجريبية |
| `pages/DocumentEditor.tsx` | **المحرر** — فورم ديناميكي من الـ `schema_snapshot` (مش الـ template الأصلي) |
| `pages/MyDocuments.tsx` | **الدوكيومنتس بتاعتي** — عرض كل اللي عملتها + حالة كل واحد |
| `components/TemplateCard.tsx` | كارد التيمبليت (زي الـ HTML المرفق) + 🔒 badge لو locked |
| `components/DynamicForm.tsx` | **فورم ديناميكي** يتولد من الـ JSON Schema |
| `components/TemplatePreviewModal.tsx` | modal المعاينة مع الأقسام و الحقول |
| `components/SaveToDriveButton.tsx` | زرار "حفظ في الدرايف" — يستدعي `saveToFileManager` API |

#### أزرار في الـ DocumentEditor:
| الزرار | الوظيفة |
|--------|---------|
| **💾 حفظ مسودة** | يحفظ الـ data كـ JSON في `user_documents` — status: draft |
| **📁 حفظ في الدرايف** | يحفظ + ينشئ ملف في File Manager + يتسنك مع Drive |
| **✅ إتمام** | يغيّر الحالة لـ completed |
| **📄 تصدير PDF** | (مستقبلاً) يولّد PDF من الـ data |

#### تعديلات على ملفات موجودة:
| ملف | التعديل |
|-----|---------|
| `types/index.ts` | إضافة interfaces: `TemplateCategory`, `Template`, `UserDocument` |
| `App.tsx` | إضافة routes جديدة |
| `Layout.tsx` | إضافة رابط في الـ sidebar |

---

### المرحلة 4: بيانات أولية (Seeder)

إنشاء `TemplateSeeder` بـ 7 تيمبليتس جاهزة:

| # | الاسم | القسم | الحقول | تعقيد |
|---|------|------|-------|------|
| 1 | Content Plan — شهري | Content | المدة, عدد البوستات, القنوات, الأهداف | بسيط (7 حقول) |
| 2 | Content Calendar | Content | أيام الأسبوع, المنصات, نوع المحتوى | بسيط (5 حقول) |
| 3 | Media Plan | Marketing | المنصات, الميزانية, KPIs, الفترة | متوسط (10 حقول) |
| 4 | **Campaign Brief** | Marketing | 21 حقل, 6 أقسام (مرفق كـ HTML) | **متقدم** |
| 5 | Sales Funnel | Sales | المراحل, الأهداف, المعايير | متوسط |
| 6 | Client Onboarding | Sales | الأسابيع, المهام, المسؤول | بسيط |
| 7 | Sprint Plan | Development | المهام, النقاط, المسؤول, المدة | بسيط |

#### 📋 Campaign Brief — Schema كامل (من الملف المرفق):
```json
{
  "name": "Campaign Brief",
  "category": "Marketing",
  "thumbnail_color": "#D85A30",
  "fields": [
    { "key": "campaign_name", "label": "اسم الحملة", "type": "text", "required": true },
    { "key": "client_name", "label": "اسم العميل", "type": "text", "required": true },
    { "key": "campaign_owner", "label": "المسؤول عن الحملة", "type": "text" },
    { "key": "start_date", "label": "تاريخ البداية", "type": "date" },
    { "key": "end_date", "label": "تاريخ النهاية", "type": "date" },
    { "key": "campaign_objective", "label": "هدف الحملة الرئيسي", "type": "select", "required": true,
      "options": ["Brand Awareness", "Lead Generation", "Conversions", "Traffic", "Engagement", "App Installs"] },
    { "key": "target_audience", "label": "الجمهور المستهدف", "type": "textarea", "required": true },
    { "key": "usp", "label": "Unique Selling Point", "type": "textarea" },
    { "key": "platforms", "label": "المنصات الإعلانية", "type": "multi_select", "required": true,
      "options": ["Meta Ads", "Instagram", "TikTok Ads", "Google Ads", "YouTube", "Snapchat"] },
    { "key": "total_budget", "label": "إجمالي الميزانية", "type": "currency", "currency": "EGP" },
    { "key": "budget_split", "label": "توزيع الميزانية", "type": "select",
      "options": ["Meta 70% / Google 30%", "Meta 60% / TikTok 40%", "موزع بالتساوي", "Custom"] },
    { "key": "kpi_leads", "label": "عدد الليدز المستهدف", "type": "number", "unit": "ليد" },
    { "key": "kpi_cpl", "label": "أقصى CPL مقبول", "type": "currency", "currency": "EGP" },
    { "key": "kpi_roas", "label": "ROAS المستهدف", "type": "number", "unit": "x" },
    { "key": "kpi_ctr", "label": "نسبة CTR المستهدفة", "type": "number", "unit": "%" },
    { "key": "kpi_impressions", "label": "Impressions المستهدفة", "type": "number" },
    { "key": "creative_types", "label": "أنواع الكريتيف", "type": "multi_select",
      "options": ["فيديو 15 ث", "كاروسيل", "Static Image", "Stories", "Reels", "UGC"] },
    { "key": "main_message", "label": "الرسالة الرئيسية", "type": "textarea" },
    { "key": "content_tone", "label": "لهجة المحتوى", "type": "select",
      "options": ["Inspiring — ملهم", "Friendly — ودود", "Professional — احترافي", "Urgent — استعجالي"] },
    { "key": "cta", "label": "الـ CTA الرئيسي", "type": "select",
      "options": ["اشتري دلوقتي", "تواصلي معنا", "سجلي بياناتك", "اعرفي أكتر"] },
    { "key": "notes", "label": "ملاحظات إضافية", "type": "textarea" }
  ],
  "sections": [
    { "title": "معلومات أساسية", "fields": ["campaign_name", "client_name", "campaign_owner", "start_date", "end_date"] },
    { "title": "الهدف والجمهور", "fields": ["campaign_objective", "target_audience", "usp"] },
    { "title": "المنصات والميزانية", "fields": ["platforms", "total_budget", "budget_split"] },
    { "title": "الـ KPIs", "fields": ["kpi_leads", "kpi_cpl", "kpi_roas", "kpi_ctr", "kpi_impressions"] },
    { "title": "الكريتيف والمحتوى", "fields": ["creative_types", "main_message", "content_tone", "cta"] },
    { "title": "ملاحظات", "fields": ["notes"] }
  ]
}
```

---

## 5. أنواع الحقول المدعومة في الـ JSON Schema

| النوع | الوصف | مثال |
|------|------|------|
| `text` | حقل نص قصير | اسم الحملة |
| `textarea` | نص طويل | الوصف, الأهداف |
| `number` | رقم | عدد البوستات, المدة |
| `currency` | مبلغ مالي | الميزانية |
| `date` | تاريخ | تاريخ البداية |
| `select` | اختيار واحد من قائمة | المنصة |
| `multi_select` | اختيار أكثر من واحد | القنوات |
| `checkbox` | صح/غلط | موافقة |
| `url` | رابط | لينك الحملة |

---

## 6. ترتيب التنفيذ المقترح

```
الأسبوع 1:
├── ✅ Migration: template_categories, templates, user_documents
├── ✅ Models: TemplateCategory, Template, UserDocument  
├── ✅ Seeder: 4 categories + 6 templates
└── ✅ Controllers: TemplateCategoryController, TemplateLibraryController, UserDocumentController

الأسبوع 2:
├── ✅ API Routes + FormRequests
├── ✅ Frontend: types, api clients, hooks
├── ✅ TemplateLibrary.tsx (الصفحة الرئيسية)
└── ✅ TemplateCard.tsx + Preview Modal

الأسبوع 3:
├── ✅ DynamicForm.tsx (الفورم الديناميكي)
├── ✅ DocumentEditor.tsx (المحرر)
├── ✅ MyDocuments.tsx (دوكيومنتس اليوزر)
└── ✅ Sidebar + Routing integration
```

---

## 7. Impact على النظام الحالي

### ✅ لا يتأثر:
- نظام `file_templates` القديم يفضل شغال كما هو
- كل الـ routes والصفحات الحالية زي ما هي
- مفيش أي تعديل على جداول موجودة

### 🔗 Integration Points:
- `user_documents` ممكن يرتبط بـ `projects` و `clients` (optional FK)
- `user_documents` بيتربط بـ `folders` و `managed_files` في File Manager
- الـ sidebar هيحتاج entry جديد بجانب "قوالب الملفات" الحالية
- ممكن مستقبلاً نربط الـ documents بالـ tasks أو الـ notifications
- **Google Drive** بيتسنك أوتوماتيك من خلال `GoogleDriveService` الموجود

---

## 8. 📁 تكامل File Manager + Google Drive (القسم الجديد)

### الفكرة:
كل دوكيومنت لما اليوزر يحفظه، بيتحول لملف حقيقي (JSON) في نظام File Manager الموجود. والـ File Manager بيسنك تلقائياً مع Google Drive.

### الـ Flow:
```
DocumentEditor → "حفظ في الدرايف" →
  1. يحفظ الـ data في user_documents (DB)
  2. يولّد ملف JSON (أو PDF مستقبلاً)
  3. يعمل ManagedFile record في File Manager
  4. يحطه في فولدر "مستندات التيمبليتس"
  5. GoogleDriveService يرفعه للـ Drive أوتوماتيك
  6. يحدّث user_documents بـ folder_id + managed_file_id
```

### هيكل الفولدرات في File Manager:
```
📁 مستندات التيمبليتس/          ← auto-created root
  ├── 📁 Marketing/              ← per category (optional)
  │   ├── 📄 Campaign Brief — 2026-03-31.json
  │   └── 📄 Media Plan — 2026-04-15.json
  ├── 📁 Sales/
  │   └── 📄 Sales Funnel — 2026-04-01.json
  └── 📁 Content/
      └── 📄 Content Plan — شهري — 2026-03-31.json
```

### الاعتماد على كود موجود:
| النظام | الاستخدام | ملاحظة |
|--------|----------|--------|
| `Folder` model | إنشاء فولدر "مستندات التيمبليتس" | `firstOrCreate` — مفيش duplicate |
| `ManagedFile` model | حفظ الملف المولّد كـ record | status: `approved` |
| `GoogleDriveService` | رفع الملف أوتوماتيك للـ Drive | لو الشركة عندها Drive متوصل |
| `FileManagerController` | اليوزر بيلاقي الملف في File Manager عادي | مفيش تعديل مطلوب عليه |

### ملاحظات:
- مفيش أي تعديل على `FileManagerController` أو `GoogleDriveService` — بنستخدمهم as-is
- لو الشركة مش متوصلة بـ Drive، الملف بيتحفظ locally بس
- الملف يبقى `approved` مباشرة — مش محتاج approval workflow

---

## 9. ملاحظات مهمة

1. **الـ JSON Schema مش JSON Schema الرسمي** — هو schema بسيط مخصص للمشروع، مش الـ standard JSON Schema (draft-07). ده أبسط وأسهل في الـ render.

2. **الـ DynamicForm** هو أهم component — لازم يدعم كل أنواع الحقول ويتولد أوتوماتيك من الـ `schema_snapshot` (مش من الـ template الأصلي).

3. **Template Protection**: 
   - التيمبليت الأصلي `is_locked = true` → اليوزر ياخد نسخة بس
   - `schema_snapshot` بيتحفظ في `user_documents` → مستقل تماماً عن التيمبليت
   - لو التيمبليت اتحذف أو اتعدل، الدوكيومنت اللي اليوزر عمله يفضل شغال

4. **الأمان**: 
   - كل `user_document` لازم يكون مربوط بـ `user_id` و `company_id`
   - اليوزر يشوف بس الدوكيومنتس بتاعته
   - الـ manager يشوف كل دوكيومنتس الشركة
   - **مفيش write access على التيمبليت الأصلي غير الـ admin**

5. **الأداء**: الـ JSON columns هتتخزن كـ `longText` في MySQL — لازم نعمل indexing على الـ FKs.

6. **RTL**: كل الـ UI لازم يكون RTL ومتوافق مع الـ Design System الحالي (Cairo font, Tailwind classes, الألوان).

7. **الحفظ في الدرايف**: اليوزر عنده خيارين:
   - **حفظ مسودة** → يحفظ في الـ DB بس (draft) — يقدر يرجعله بعدين ويكمل
   - **حفظ في الدرايف** → يحفظ DB + ينشئ ملف في File Manager + يسنك مع Drive

---

## 10. 🏗️ Template Builder (مرحلة متقدمة — مستقبلاً)

> مش في الـ MVP — ده Phase 2. بناءً على ملف `plankit_campaign_brief_template.html` المرفق.

### الفكرة:
صفحة تسمح للأدمن يبني تيمبليت جديد بصرياً (Drag & Drop fields) بدل ما يكتب JSON يدوياً.

### مميزات الـ Builder (من الملف المرفق):
| الميزة | الوصف |
|--------|------|
| **Form View** | فورم تجريبي يملأه الأدمن عشان يشوف شكل الحقول |
| **Preview View** | بريفيو حي يتحرك مع التعديل (زي الـ HTML المرفق) |
| **JSON Schema View** | يعرض الـ JSON الناتج من الفورم — الأدمن يقدر ينسخه |
| **Sections** | تقسيم الحقول على أقسام (زي: معلومات أساسية، الهدف، الميزانية) |
| **Field Types** | دعم كل أنواع الحقول (text, select, multi_select, currency, date...) |
| **Live Preview** | كل تعديل في الفورم بيظهر مباشرة في البريفيو |

### ملاحظة:
في الـ MVP هنكتب الـ JSON Schema يدوياً في الـ Seeder أو من Dashboard الأدمن — مش محتاجين Builder دلوقتي.

---

## 11. الملفات اللي هتتعمل (ملخص)

### Backend (8 ملفات):
```
database/migrations/xxxx_create_template_library_tables.php
app/Models/TemplateCategory.php
app/Models/Template.php  
app/Models/UserDocument.php
app/Http/Controllers/Api/TemplateCategoryController.php
app/Http/Controllers/Api/TemplateLibraryController.php
app/Http/Controllers/Api/UserDocumentController.php
database/seeders/TemplateSeeder.php
```

### Frontend (12 ملف):
```
src/api/templateLibrary.ts
src/api/userDocuments.ts
src/hooks/useTemplateLibrary.ts
src/hooks/useUserDocuments.ts
src/pages/TemplateLibrary.tsx
src/pages/DocumentEditor.tsx
src/pages/MyDocuments.tsx
src/components/TemplateCard.tsx
src/components/TemplatePreviewModal.tsx
src/components/DynamicForm.tsx
src/components/SaveToDriveButton.tsx
```

### تعديل ملفات موجودة (3 ملفات):
```
src/types/index.ts          ← إضافة interfaces (TemplateCategory, Template, UserDocument)
src/App.tsx                 ← إضافة routes جديدة
src/components/Layout.tsx   ← إضافة sidebar link
```

### مفيش تعديل على (0 تأثير):
```
FileManagerController.php   ← بنستخدم Models بتاعته بس
GoogleDriveService.php      ← بنستدعيه من UserDocumentController
Folder.php / ManagedFile.php ← بنعمل records فيهم بس
```

---

## 12. سؤال قبل البدء

> هل نبدأ التنفيذ كامل (Backend + Frontend) ولا نبدأ بالـ Backend الأول ونتأكد إنه شغال ثم الـ Frontend؟

---

*آخر تحديث: 31 مارس 2026*
