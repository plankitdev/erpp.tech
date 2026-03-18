<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadActivityRequest;
use App\Http\Resources\LeadActivityResource;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class LeadActivityController extends Controller
{
    use ApiResponse;

    public function index(Lead $lead): JsonResponse
    {
        $this->authorize('view', $lead);

        $activities = $lead->activities()->with('user')->paginate(50);

        return $this->paginatedResponse($activities);
    }

    public function store(StoreLeadActivityRequest $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $data = $request->validated();
        $data['user_id'] = auth()->id();

        $activity = $lead->activities()->create($data);

        // Update lead's last followup date
        $lead->update(['last_followup_date' => now()->toDateString()]);

        // If next followup date is set, update on lead too
        if (!empty($data['next_followup_date'])) {
            $lead->update(['last_followup_date' => now()->toDateString()]);
        }

        $activity->load('user');

        return $this->successResponse(new LeadActivityResource($activity), 'تم إضافة النشاط بنجاح', 201);
    }
}
