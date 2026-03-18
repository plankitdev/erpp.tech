<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $query = Lead::with('assignee')
            ->withCount('activities')
            ->orderByDesc('updated_at');

        if ($stage = $request->input('stage')) {
            $query->where('stage', $stage);
        }
        if ($source = $request->input('source')) {
            $query->where('source', $source);
        }
        if ($serviceType = $request->input('service_type')) {
            $query->where('service_type', $serviceType);
        }
        if ($assignedTo = $request->input('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $leads = $query->paginate($this->getPerPage(50));

        return $this->paginatedResponse($leads);
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $this->authorize('create', Lead::class);

        $lead = Lead::create($request->validated());
        $lead->load('assignee');

        return $this->successResponse(new LeadResource($lead), 'تم إضافة العميل المحتمل بنجاح', 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);

        $lead->load(['assignee', 'activities.user', 'convertedClient']);

        return $this->successResponse(new LeadResource($lead));
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $lead->update($request->validated());
        $lead->load('assignee');

        return $this->successResponse(new LeadResource($lead), 'تم تحديث العميل المحتمل بنجاح');
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $this->authorize('delete', $lead);

        $lead->delete();

        return $this->successResponse(null, 'تم حذف العميل المحتمل');
    }

    /**
     * Update lead stage (drag & drop in Kanban)
     */
    public function updateStage(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $request->validate([
            'stage' => 'required|in:' . implode(',', Lead::STAGES),
            'lost_reason' => 'nullable|string|max:500',
        ]);

        $updateData = ['stage' => $request->stage];
        if ($request->stage === Lead::STAGE_LOST && $request->lost_reason) {
            $updateData['lost_reason'] = $request->lost_reason;
        }

        $lead->update($updateData);

        return $this->successResponse(new LeadResource($lead), 'تم تحديث المرحلة');
    }

    /**
     * Convert lead to client + contract
     */
    public function convertToClient(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        if ($lead->converted_client_id) {
            return $this->errorResponse('تم تحويل هذا العميل المحتمل مسبقاً');
        }

        $request->validate([
            'contract_value'    => 'required|numeric|min:0',
            'currency'          => 'required|in:EGP,USD,SAR',
            'payment_type'      => 'required|in:monthly,installments,one_time',
            'start_date'        => 'required|date',
            'end_date'          => 'nullable|date|after:start_date',
            'installments_count' => 'nullable|integer|min:1',
        ]);

        // Create the client
        $client = \App\Models\Client::create([
            'name'         => $lead->name,
            'phone'        => $lead->phone,
            'company_name' => null,
            'sector'       => null,
            'service'      => $lead->service_type,
            'status'       => 'active',
            'notes'        => $lead->notes,
        ]);

        // Create the contract
        $contract = \App\Models\Contract::create([
            'client_id'          => $client->id,
            'value'              => $request->contract_value,
            'currency'           => $request->currency,
            'payment_type'       => $request->payment_type,
            'start_date'         => $request->start_date,
            'end_date'           => $request->end_date,
            'installments_count' => $request->installments_count,
            'installment_amount' => $request->installments_count
                ? round($request->contract_value / $request->installments_count, 2)
                : null,
            'status'             => 'active',
        ]);

        // Mark lead as converted
        $lead->update([
            'stage'              => Lead::STAGE_CONTRACT_SIGNED,
            'converted_client_id' => $client->id,
            'final_amount'       => $request->contract_value,
        ]);

        return $this->successResponse([
            'client_id'   => $client->id,
            'contract_id' => $contract->id,
        ], 'تم تحويل العميل المحتمل إلى عميل وعقد بنجاح');
    }

    /**
     * Download CSV import template
     */
    public function importTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = ['name', 'phone', 'email', 'source', 'service_type', 'expected_budget', 'notes'];
        $example = ['أحمد محمد', '01012345678', 'ahmed@example.com', 'ad', 'marketing', '5000', 'ملاحظات'];

        return response()->streamDownload(function () use ($headers, $example) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);
            fputcsv($handle, $example);
            fclose($handle);
        }, 'leads_template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Import leads from CSV
     */
    public function import(Request $request): JsonResponse
    {
        $this->authorize('create', Lead::class);

        $request->validate([
            'file' => 'required|file|max:2048',
        ]);

        $ext = strtolower($request->file('file')->getClientOriginalExtension());
        if (!in_array($ext, ['csv', 'txt'])) {
            return $this->errorResponse('يرجى رفع ملف CSV أو TXT فقط', 422);
        }

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if (!$handle) {
            return $this->errorResponse('فشل في قراءة الملف');
        }

        // Read header row
        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return $this->errorResponse('الملف فارغ');
        }

        // Normalize headers (trim BOM + whitespace)
        $header = array_map(fn ($h) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', $h))), $header);

        $validSources = ['ad', 'referral', 'website', 'social', 'other'];
        $validServices = ['marketing', 'design', 'moderation', 'development', 'other'];

        $imported = 0;
        $failed = 0;
        $errors = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            $padded = array_pad($data, count($header), '');
            $record = array_combine($header, array_slice($padded, 0, count($header)));

            $name = trim($record['name'] ?? '');
            if (!$name) {
                $failed++;
                $errors[] = "صف {$row}: الاسم مطلوب";
                continue;
            }

            $source = trim($record['source'] ?? 'other');
            if (!in_array($source, $validSources)) {
                $source = 'other';
            }

            $serviceType = trim($record['service_type'] ?? 'other');
            if (!in_array($serviceType, $validServices)) {
                $serviceType = 'other';
            }

            $budget = trim($record['expected_budget'] ?? '');

            Lead::create([
                'name'            => $name,
                'phone'           => trim($record['phone'] ?? '') ?: null,
                'email'           => trim($record['email'] ?? '') ?: null,
                'source'          => $source,
                'service_type'    => $serviceType,
                'expected_budget' => is_numeric($budget) ? (float) $budget : null,
                'notes'           => trim($record['notes'] ?? '') ?: null,
                'stage'           => Lead::STAGE_NEW,
            ]);

            $imported++;
        }

        fclose($handle);

        return $this->successResponse([
            'imported' => $imported,
            'failed'   => $failed,
            'errors'   => $errors,
        ], "تم استيراد {$imported} عميل محتمل بنجاح" . ($failed > 0 ? " ({$failed} فشل)" : ''));
    }
}
