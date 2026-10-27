<?php

namespace Modules\Operations\Models;

use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Enums\DomainStatus;
use Modules\Shared\Models\BaseModel;

/**
 * @property DomainStatus $status
 */
class CustomDomain extends BaseModel
{
    use Auditable;

    protected $table = 'custom_domains';

    protected function casts(): array
    {
        return [
            'status' => DomainStatus::class,
            'verified_at' => 'datetime',
        ];
    }

    /** DNS TXT record the owner must publish to prove ownership. */
    public function txtHost(): string
    {
        return '_menuhub.'.$this->domain;
    }

    public function txtValue(): string
    {
        return 'menuhub-verify='.$this->verification_token;
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }
}
