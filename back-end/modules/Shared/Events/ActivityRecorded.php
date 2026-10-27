<?php

namespace Modules\Shared\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Something worth an audit-log line happened. Emitted by the `Auditable`
 * trait and persisted by the Audit module.
 */
class ActivityRecorded
{
    use Dispatchable;

    /**
     * @param  array<string, mixed>|null  $old
     * @param  array<string, mixed>|null  $new
     */
    public function __construct(
        public readonly ?string $restaurantId,
        public readonly ?string $userId,
        public readonly string $action,
        public readonly ?string $entityType = null,
        public readonly ?string $entityId = null,
        public readonly ?array $old = null,
        public readonly ?array $new = null,
    ) {}
}
