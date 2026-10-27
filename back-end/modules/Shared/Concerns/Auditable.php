<?php

namespace Modules\Shared\Concerns;

use Illuminate\Support\Str;
use Modules\Shared\Events\ActivityRecorded;

/**
 * Records created / updated / deleted lines in the audit log.
 *
 * The model must implement `auditRestaurantId()`.
 */
trait Auditable
{
    /** Columns that never appear in the audit payload. */
    protected array $auditExcluded = ['updated_at', 'created_at', 'password', 'remember_token'];

    public static function bootAuditable(): void
    {
        static::created(fn ($model) => $model->recordActivity('created'));
        static::updated(fn ($model) => $model->recordActivity('updated'));
        static::deleted(fn ($model) => $model->recordActivity('deleted'));
    }

    abstract public function auditRestaurantId(): ?string;

    public function auditEntity(): string
    {
        return Str::snake(class_basename($this));
    }

    protected function recordActivity(string $event): void
    {
        $old = $new = null;

        if ($event === 'updated') {
            $changes = array_diff_key($this->getChanges(), array_flip($this->auditExcluded));
            if ($changes === []) {
                return;
            }
            $new = $changes;
            $old = array_intersect_key($this->getOriginal(), $changes);
        } elseif ($event === 'created') {
            $new = array_diff_key($this->attributesToArray(), array_flip($this->auditExcluded));
        } else {
            $old = array_diff_key($this->attributesToArray(), array_flip($this->auditExcluded));
        }

        event(new ActivityRecorded(
            restaurantId: $this->auditRestaurantId(),
            userId: auth()->id(),
            action: $this->auditEntity().'.'.$event,
            entityType: $this->auditEntity(),
            entityId: (string) $this->getKey(),
            old: $old,
            new: $new,
        ));
    }
}
