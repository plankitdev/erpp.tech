<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Client::class);

        $clients = Client::with('activeContract')
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('company_name', 'like', "%{$request->search}%")
            )
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->service, fn($q) => $q->where('service', $request->service))
            ->latest()
            ->paginate($this->getPerPage());

        return $this->paginatedResponse($clients);
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $client = Client::create($request->validated());
        return $this->successResponse(new ClientResource($client), 'تم إضافة العميل بنجاح', 201);
    }

    public function show(Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        $client->load([
            'contracts',
            'invoices' => fn($q) => $q->latest()->limit(10),
            'projects' => fn($q) => $q->select('id', 'slug', 'name', 'status', 'client_id', 'start_date', 'end_date')
                ->withCount('tasks'),
            'tasks' => fn($q) => $q->with('assignedUser')->latest()->limit(10),
        ]);
        return $this->successResponse(new ClientResource($client));
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        $client->update($request->validated());
        return $this->successResponse(new ClientResource($client), 'تم تحديث العميل');
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('delete', $client);

        $client->delete();
        return $this->successResponse(null, 'تم حذف العميل');
    }

    public function batchDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', Client::class);

        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:clients,id']);
        Client::whereIn('id', $request->ids)->delete();
        return $this->successResponse(null, 'تم حذف العملاء المحددين');
    }
}
