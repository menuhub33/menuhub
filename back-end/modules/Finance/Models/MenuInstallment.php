<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Enums\InstallmentKind;
use Modules\Shared\Enums\InstallmentStatus;
use Modules\Shared\Models\BaseModel;

/**
 * @property InstallmentKind $kind
 * @property InstallmentStatus $status
 */
class MenuInstallment extends BaseModel
{
    public const UPDATED_AT = null;

    protected $table = 'menu_installments';

    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'amount' => 'float',
            'kind' => InstallmentKind::class,
            'status' => InstallmentStatus::class,
            'due_on' => 'date:Y-m-d',
            'paid_at' => 'datetime',
        ];
    }

    public function billing(): BelongsTo
    {
        return $this->belongsTo(MenuBilling::class, 'billing_id');
    }
}
