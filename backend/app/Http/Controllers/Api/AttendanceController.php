<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::with('user');
        $user = $request->user();

        if (!in_array($user->role, ['super_admin', 'manager'])) {
            $query->where('user_id', $user->id);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->date) {
            $query->whereDate('date', $request->date);
        }
        if ($request->month) {
            $query->whereMonth('date', $request->month);
        }
        if ($request->year) {
            $query->whereYear('date', $request->year ?: now()->year);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $records = $query->latest('date')->paginate($this->getPerPage());
        return $this->paginatedResponse($records);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $existing = AttendanceRecord::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if ($existing && $existing->check_in) {
            return $this->errorResponse('تم تسجيل الحضور مسبقاً اليوم');
        }

        $now = now()->format('H:i:s');
        $status = now()->hour >= 10 ? 'late' : 'present';

        if ($existing) {
            $existing->update(['check_in' => $now, 'status' => $status]);
            $record = $existing;
        } else {
            $record = AttendanceRecord::create([
                'company_id' => $user->company_id,
                'user_id' => $user->id,
                'date' => $today,
                'check_in' => $now,
                'status' => $status,
            ]);
        }

        return $this->successResponse($record->load('user'), 'تم تسجيل الحضور');
    }

    public function checkOut(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $record = AttendanceRecord::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if (!$record || !$record->check_in) {
            return $this->errorResponse('لم يتم تسجيل الحضور اليوم بعد');
        }

        if ($record->check_out) {
            return $this->errorResponse('تم تسجيل الانصراف مسبقاً');
        }

        $checkIn = \Carbon\Carbon::parse($record->date->format('Y-m-d') . ' ' . $record->check_in);
        $checkOut = now();
        $hours = $checkIn->diffInMinutes($checkOut) / 60;

        $record->update([
            'check_out' => $checkOut->format('H:i:s'),
            'hours_worked' => round($hours, 2),
            'status' => $hours < 4 ? 'half_day' : $record->status,
        ]);

        return $this->successResponse($record->load('user'), 'تم تسجيل الانصراف');
    }

    public function today(Request $request): JsonResponse
    {
        $record = AttendanceRecord::with('user')
            ->where('user_id', $request->user()->id)
            ->whereDate('date', now()->toDateString())
            ->first();

        return $this->successResponse($record);
    }

    public function store(Request $request): JsonResponse
    {
        if (!in_array($request->user()->role, ['super_admin', 'manager'])) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'status' => 'required|in:' . implode(',', AttendanceRecord::STATUSES),
            'notes' => 'nullable|string|max:500',
        ]);

        if (isset($data['check_in']) && isset($data['check_out'])) {
            $ci = \Carbon\Carbon::parse($data['date'] . ' ' . $data['check_in']);
            $co = \Carbon\Carbon::parse($data['date'] . ' ' . $data['check_out']);
            $data['hours_worked'] = round($ci->diffInMinutes($co) / 60, 2);
        }

        $record = AttendanceRecord::updateOrCreate(
            ['company_id' => $request->user()->company_id, 'user_id' => $data['user_id'], 'date' => $data['date']],
            $data
        );

        return $this->successResponse($record->load('user'), 'تم حفظ سجل الحضور');
    }

    public function summary(Request $request): JsonResponse
    {
        $userId = $request->user_id ?: $request->user()->id;
        $month = $request->month ?: now()->month;
        $year = $request->year ?: now()->year;

        $records = AttendanceRecord::where('user_id', $userId)
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        return $this->successResponse([
            'total_days' => $records->count(),
            'present' => $records->where('status', 'present')->count(),
            'late' => $records->where('status', 'late')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'half_day' => $records->where('status', 'half_day')->count(),
            'leave' => $records->where('status', 'leave')->count(),
            'total_hours' => round($records->sum('hours_worked'), 2),
            'avg_hours' => $records->count() > 0 ? round($records->avg('hours_worked'), 2) : 0,
        ]);
    }
}
