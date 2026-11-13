<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;
use Modules\Orders\Models\Order;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Enums\PaymentMethod;
use Modules\Shared\Enums\PaymentType;
use Modules\Shared\Models\BaseModel;
use Modules\Users\Models\User;

/**
 * One line of the money ledger (a collection or a refund).
 *
 * Append-only: a financial correction is a new, opposite row.
 *
 * @property PaymentType $type
 * @property PaymentMethod $method
 */
class OrderPayment extends BaseModel
{
    use Auditable;

    public const UPDATED_AT = null;

    protected $table = 'order_payments';

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Payment records are immutable.'));
        static::deleting(fn () => throw new LogicException('Payment records cannot be deleted.'));
    }

    protected function casts(): array
    {
        return [
            'type' => PaymentType::class,
            'method' => PaymentMethod::class,
            'amount' => 'decimal:2',
            'tendered_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }

    public function auditEntity(): string
    {
        return 'order_payment';
    }
}
