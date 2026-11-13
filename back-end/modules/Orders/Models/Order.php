<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Enums\KitchenStatus;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Enums\SalesChannel;
use Modules\Shared\Enums\SalesPaymentStatus;
use Modules\Shared\Models\BaseModel;
use Modules\Shared\Support\Money;
use Modules\Tenancy\Models\Restaurant;

/**
 * The single sales document of every channel (QR, POS, STAFF, EXTERNAL).
 *
 * `status` is the fulfillment status (PENDING is exposed as OPEN by the sales API).
 *
 * @property OrderStatus $status
 * @property SalesChannel $channel
 * @property SalesPaymentStatus $payment_status
 */
class Order extends BaseModel
{
    protected $table = 'orders';

    /**
     * Mirrors the column defaults so a freshly created (not re-fetched) model is complete.
     * Orders created by the legacy QR flow never set these.
     */
    protected $attributes = [
        'channel' => 'QR',
        'payment_status' => 'UNPAID',
        'is_legacy' => false,
        'subtotal' => '0.00',
        'discount_total' => '0.00',
        'paid_amount' => '0.00',
        'refunded_amount' => '0.00',
        'kitchen_status' => 'NEW',
    ];

    /** `delivery_type` (stored) => `order_type` (API). */
    public const ORDER_TYPES = [
        'dine_in' => 'DINE_IN',
        'pickup' => 'TAKEAWAY',
        'delivery' => 'DELIVERY',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'channel' => SalesChannel::class,
            'payment_status' => SalesPaymentStatus::class,
            'is_legacy' => 'boolean',
            'kitchen_status' => KitchenStatus::class,
            'kitchen_status_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'total' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'refunded_amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'inventory_deducted_at' => 'datetime',
            'inventory_restored_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /* `payments` is added by the Sales module (Order::resolveRelationUsing). */

    /** API name of the stored `delivery_type`. */
    public function orderType(): string
    {
        return self::ORDER_TYPES[$this->delivery_type] ?? strtoupper((string) $this->delivery_type);
    }

    /** Amount still due; refunds never re-open the balance (spec ADR-05). */
    public function balanceDue(): string
    {
        return Money::format(max(0, Money::cents($this->total) - Money::cents($this->paid_amount)));
    }
}
