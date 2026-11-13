<?php

namespace Modules\Orders\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Orders\Models\Order;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'delivery_type' => $this->delivery_type,
            'branch_name' => $this->branch_name,
            'table_number' => $this->table_number,
            'address' => $this->address,
            'latitude' => $this->latitude === null ? null : (float) $this->latitude,
            'longitude' => $this->longitude === null ? null : (float) $this->longitude,
            'currency' => $this->currency,
            'total' => (float) $this->total,
            'channel' => $this->channel->value,
            'order_type' => $this->orderType(),
            'fulfillment_status' => $this->status->fulfillment(),
            'payment_status' => $this->payment_status->value,
            'paid_amount' => (float) $this->paid_amount,
            'balance_due' => (float) $this->balanceDue(),
            'is_legacy' => $this->is_legacy,
            'notes' => $this->notes,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name_ar' => $item->name_ar,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price === null ? null : (float) $item->unit_price,
                'extra' => (float) $item->extra,
                'line_total' => $item->line_total === null ? null : (float) $item->line_total,
            ])->values()->all()),
        ];
    }
}
