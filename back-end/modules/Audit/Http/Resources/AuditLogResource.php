<?php

namespace Modules\Audit\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Audit\Models\AuditLog;
use Modules\Audit\Support\AuditLabels;

/** @mixin AuditLog */
class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payload = $this->new_data ?? $this->old_data ?? [];

        return [
            'id' => $this->id,
            'action' => $this->action,
            'label' => AuditLabels::describe($this->action),
            'subject' => $payload['name_ar'] ?? $payload['name'] ?? null,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'actor_name' => $this->user?->full_name,
            'old_data' => $this->old_data,
            'new_data' => $this->new_data,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
