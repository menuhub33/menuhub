<?php

namespace Modules\Sales\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Orders\Models\Order;

/** @mixin Order */
class SalesOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'channel' => $this->channel->value,
            'order_type' => $this->orderType(),
            'status' => $this->status->value,
            'fulfillment_status' => $this->status->fulfillment(),
            'payment_status' => $this->payment_status->value,
            'kitchen_status' => $this->kitchen_status->value,
            'is_legacy' => $this->is_legacy,
            'requires_pricing' => $this->relationLoaded('items')
                ? $this->items->contains(fn ($item) => $item->line_total === null)
                : null,
            'currency' => $this->currency,
            'subtotal' => (float) $this->subtotal,
            'discount_total' => (float) $this->discount_total,
            'total' => (float) $this->total,
            'paid_amount' => (float) $this->paid_amount,
            'refunded_amount' => (float) $this->refunded_amount,
            'balance_due' => (float) $this->balanceDue(),
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch_name,
            'table_number' => $this->table_number,
            'address' => $this->address,
            'notes' => $this->notes,
            'discount_note' => $this->discount_note,
            'opened_by' => $this->opened_by ? [
                'id' => $this->opened_by,
                'name' => $this->relationLoaded('opener') ? $this->opener?->full_name : null,
            ] : null,
            'cashier_id' => $this->cashier_id,
            'cancel_reason' => $this->cancel_reason,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name_ar' => $item->name_ar,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price === null ? null : (float) $item->unit_price,
                'discount_total' => (float) $item->discount_total,
                'line_total' => $item->line_total === null ? null : (float) $item->line_total,
                'line_net' => $item->line_net === null ? null : (float) $item->line_net,
                'note' => $item->note,
            ])->values()->all()),
            'payments' => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'type' => $payment->type->value,
                'method' => $payment->method->value,
                'amount' => (float) $payment->amount,
                'tendered_amount' => $payment->tendered_amount === null ? null : (float) $payment->tendered_amount,
                'change_amount' => $payment->change_amount === null ? null : (float) $payment->change_amount,
                'reason' => $payment->reason,
                'notes' => $payment->notes,
                'reference' => $payment->reference,
                'created_by' => $payment->created_by,
                'created_at' => $payment->created_at?->toIso8601String(),
            ])->values()->all()),
        ];
    }
}
