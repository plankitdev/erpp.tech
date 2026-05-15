<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalEntryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = JournalEntry::with(['lines.account', 'lines.costCenter', 'creator'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->from, fn($q, $d) => $q->where('date', '>=', $d))
            ->when($request->to, fn($q, $d) => $q->where('date', '<=', $d))
            ->when($request->search, fn($q, $s) => $q->where('description', 'like', "%{$s}%"))
            ->orderByDesc('date')->orderByDesc('id');

        return $this->paginatedResponse($query->paginate($this->getPerPage()));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'            => 'required|date',
            'description'     => 'required|string|max:1000',
            'reference_type'  => 'nullable|string|max:50',
            'reference_id'    => 'nullable|integer',
            'currency'        => 'sometimes|in:EGP,USD,SAR',
            'lines'           => 'required|array|min:2',
            'lines.*.account_id'     => 'required|exists:chart_of_accounts,id',
            'lines.*.debit'          => 'required|numeric|min:0',
            'lines.*.credit'         => 'required|numeric|min:0',
            'lines.*.description'    => 'nullable|string|max:500',
            'lines.*.cost_center_id' => 'nullable|exists:cost_centers,id',
        ], [
            'date.required'        => 'التاريخ مطلوب',
            'description.required' => 'الوصف مطلوب',
            'lines.required'       => 'سطور القيد مطلوبة',
            'lines.min'            => 'القيد يجب أن يحتوي على سطرين على الأقل',
        ]);

        // Validate balance
        $totalDebit = collect($data['lines'])->sum('debit');
        $totalCredit = collect($data['lines'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return $this->errorResponse('القيد غير متوازن. إجمالي المدين يجب أن يساوي إجمالي الدائن', 422);
        }

        // Validate each line: must have debit OR credit, not both
        foreach ($data['lines'] as $line) {
            if ($line['debit'] > 0 && $line['credit'] > 0) {
                return $this->errorResponse('كل سطر يجب أن يكون مدين أو دائن وليس كلاهما', 422);
            }
            if ($line['debit'] == 0 && $line['credit'] == 0) {
                return $this->errorResponse('كل سطر يجب أن يحتوي على مبلغ مدين أو دائن', 422);
            }
        }

        return DB::transaction(function () use ($data, $totalDebit, $totalCredit) {
            // Generate entry number with lock to prevent race conditions
            $lastEntry = JournalEntry::where('company_id', auth()->user()->company_id)
                ->lockForUpdate()
                ->orderByDesc('id')->first();
            $nextNumber = $lastEntry
                ? 'JE-' . str_pad((int) str_replace('JE-', '', $lastEntry->entry_number) + 1, 6, '0', STR_PAD_LEFT)
                : 'JE-000001';

            $entry = JournalEntry::create([
                'entry_number'   => $nextNumber,
                'date'           => $data['date'],
                'description'    => $data['description'],
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id'   => $data['reference_id'] ?? null,
                'currency'       => $data['currency'] ?? 'EGP',
                'total_debit'    => $totalDebit,
                'total_credit'   => $totalCredit,
                'created_by'     => auth()->id(),
                'status'         => JournalEntry::STATUS_DRAFT,
            ]);

            foreach ($data['lines'] as $line) {
                $entry->lines()->create($line);
            }

            return $this->successResponse(
                $entry->load(['lines.account', 'lines.costCenter', 'creator']),
                'تم إنشاء القيد بنجاح',
                201
            );
        });
    }

    public function show(JournalEntry $journalEntry): JsonResponse
    {
        return $this->successResponse(
            $journalEntry->load(['lines.account', 'lines.costCenter', 'creator', 'poster'])
        );
    }

    public function update(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        if ($journalEntry->status !== JournalEntry::STATUS_DRAFT) {
            return $this->errorResponse('لا يمكن تعديل قيد مرحّل أو معكوس', 422);
        }

        $data = $request->validate([
            'date'            => 'sometimes|date',
            'description'     => 'sometimes|string|max:1000',
            'reference_type'  => 'nullable|string|max:50',
            'reference_id'    => 'nullable|integer',
            'lines'           => 'sometimes|array|min:2',
            'lines.*.account_id'     => 'required|exists:chart_of_accounts,id',
            'lines.*.debit'          => 'required|numeric|min:0',
            'lines.*.credit'         => 'required|numeric|min:0',
            'lines.*.description'    => 'nullable|string|max:500',
            'lines.*.cost_center_id' => 'nullable|exists:cost_centers,id',
        ]);

        try {
            return DB::transaction(function () use ($data, $journalEntry) {
                if (isset($data['lines'])) {
                    $totalDebit = collect($data['lines'])->sum('debit');
                    $totalCredit = collect($data['lines'])->sum('credit');

                    if (abs($totalDebit - $totalCredit) > 0.01) {
                        throw new \InvalidArgumentException('القيد غير متوازن');
                    }

                    // Validate each line: must have debit OR credit, not both
                    foreach ($data['lines'] as $line) {
                        if ($line['debit'] > 0 && $line['credit'] > 0) {
                            throw new \InvalidArgumentException('كل سطر يجب أن يكون مدين أو دائن وليس كلاهما');
                        }
                        if ($line['debit'] == 0 && $line['credit'] == 0) {
                            throw new \InvalidArgumentException('كل سطر يجب أن يحتوي على مبلغ مدين أو دائن');
                        }
                    }

                    $journalEntry->lines()->delete();
                    foreach ($data['lines'] as $line) {
                        $journalEntry->lines()->create($line);
                    }

                    $data['total_debit'] = $totalDebit;
                    $data['total_credit'] = $totalCredit;
                }

                $journalEntry->update(collect($data)->only(['date', 'description', 'reference_type', 'reference_id', 'total_debit', 'total_credit'])->toArray());

            return $this->successResponse(
                $journalEntry->fresh()->load(['lines.account', 'lines.costCenter', 'creator']),
                'تم تحديث القيد بنجاح'
            );
        });
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function destroy(JournalEntry $journalEntry): JsonResponse
    {
        if (in_array($journalEntry->status, [JournalEntry::STATUS_POSTED, JournalEntry::STATUS_REVERSED])) {
            return $this->errorResponse('لا يمكن حذف قيد مرحّل أو معكوس. يمكنك عكسه فقط', 422);
        }

        $journalEntry->lines()->delete();
        $journalEntry->delete();

        return $this->successResponse(null, 'تم حذف القيد بنجاح');
    }

    public function post(JournalEntry $journalEntry): JsonResponse
    {
        if ($journalEntry->status !== JournalEntry::STATUS_DRAFT) {
            return $this->errorResponse('يمكن ترحيل القيود المسودة فقط', 422);
        }

        if (!$journalEntry->is_balanced) {
            return $this->errorResponse('القيد غير متوازن', 422);
        }

        $journalEntry->update([
            'status'    => JournalEntry::STATUS_POSTED,
            'posted_by' => auth()->id(),
            'posted_at' => now(),
        ]);

        return $this->successResponse(
            $journalEntry->fresh()->load(['lines.account', 'creator', 'poster']),
            'تم ترحيل القيد بنجاح'
        );
    }

    public function reverse(JournalEntry $journalEntry): JsonResponse
    {
        if ($journalEntry->status !== JournalEntry::STATUS_POSTED) {
            return $this->errorResponse('يمكن عكس القيود المرحّلة فقط', 422);
        }

        return DB::transaction(function () use ($journalEntry) {
            // Create reverse entry with lock to prevent race conditions
            $lastEntry = JournalEntry::where('company_id', auth()->user()->company_id)
                ->lockForUpdate()
                ->orderByDesc('id')->first();
            $nextNumber = 'JE-' . str_pad((int) str_replace('JE-', '', $lastEntry->entry_number) + 1, 6, '0', STR_PAD_LEFT);

            $reverseEntry = JournalEntry::create([
                'entry_number'   => $nextNumber,
                'date'           => now()->toDateString(),
                'description'    => "عكس قيد: {$journalEntry->entry_number} - {$journalEntry->description}",
                'reference_type' => 'journal_reversal',
                'reference_id'   => $journalEntry->id,
                'currency'       => $journalEntry->currency,
                'total_debit'    => $journalEntry->total_credit,
                'total_credit'   => $journalEntry->total_debit,
                'status'         => JournalEntry::STATUS_POSTED,
                'created_by'     => auth()->id(),
                'posted_by'      => auth()->id(),
                'posted_at'      => now(),
            ]);

            foreach ($journalEntry->lines as $line) {
                $reverseEntry->lines()->create([
                    'account_id'     => $line->account_id,
                    'debit'          => $line->credit,
                    'credit'         => $line->debit,
                    'description'    => "عكس: {$line->description}",
                    'cost_center_id' => $line->cost_center_id,
                ]);
            }

            $journalEntry->update(['status' => JournalEntry::STATUS_REVERSED]);

            return $this->successResponse(
                $reverseEntry->load(['lines.account', 'creator']),
                'تم عكس القيد بنجاح'
            );
        });
    }
}
