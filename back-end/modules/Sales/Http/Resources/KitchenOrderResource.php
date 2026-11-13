<?php

namespace Modules\Sales\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Orders\Models\Order;

/**
 * What the kitchen screen needs and nothing more: what to cook, for where, and since when.
 * No prices, discounts or payments.
 *
 * @mixin Order
 */
class KitchenOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'channel' => $this->channel->value,
            'order_type' => $this->orderType(),
            'table_number' => $this->table_number,
            'branch_name' => $this->branch_name,
            'notes' => $this->notes,
            'kitchen_status' => $this->kitchen_status->value,
            'kitchen_status_at' => $this->kitchen_status_at?->toIso8601String(),
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'opened_by' => $this->relationLoaded('opener') ? $this->opener?->full_name : null,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'name_ar' => $item->name_ar,
                'quantity' => $item->quantity,
                'note' => $item->note,
            ])->values()->all()),
        ];
    }
}
