<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Billing\Models\Plan;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

/**
 * @property DiscountType $discount_type
 */
class MenuBilling extends BaseModel
{
    protected $table = 'menu_billings';

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'pos_price' => 'float',
            'setup_cost' => 'float',
            'annual_renewal' => 'float',
            'discount_value' => 'float',
            'installments_count' => 'integer',
            'discount_type' => DiscountType::class,
            'starts_on' => 'date:Y-m-d',
            'next_renewal_on' => 'date:Y-m-d',
            'expired_notified_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(MenuInstallment::class, 'billing_id')->orderBy('due_on');
    }
}
