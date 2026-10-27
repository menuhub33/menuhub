<?php

namespace Modules\Shared\Concerns;

use Modules\Shared\Events\RestaurantContentChanged;

/**
 * Tells the rest of the system that the public menu of a restaurant is stale.
 * The model must implement `contentRestaurantId()`.
 */
trait PublishesContentChanges
{
    public static function bootPublishesContentChanges(): void
    {
        $notify = function ($model): void {
            $id = $model->contentRestaurantId();
            if ($id) {
                RestaurantContentChanged::dispatch($id);
            }
        };

        static::saved($notify);
        static::deleted($notify);
    }

    abstract public function contentRestaurantId(): ?string;
}
