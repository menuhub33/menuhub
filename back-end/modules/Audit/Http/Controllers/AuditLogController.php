<?php

namespace Modules\Audit\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Audit\Http\Resources\AuditLogResource;
use Modules\Audit\Models\AuditLog;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class AuditLogController extends ApiController
{
    public function index(Request $request, Restaurant $restaurant)
    {
        $logs = AuditLog::query()
            ->with('user:id,full_name')
            ->forRestaurant($restaurant->id)
            ->when($request->filled('entity_type'), fn ($q) => $q->where('entity_type', $request->query('entity_type')))
            ->latest('created_at')
            ->paginate($this->perPage(25));

        return AuditLogResource::collection($logs);
    }
}
