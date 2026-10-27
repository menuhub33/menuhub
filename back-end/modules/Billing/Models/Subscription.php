<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Enums\SubscriptionStatus;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

/**
 * @property SubscriptionStatus $status
 */
class Subscription extends BaseModel
{
    protected $table = 'subscriptions';

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'auto_renew' => 'boolean',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
