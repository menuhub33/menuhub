<?php

namespace Modules\Tenancy\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Modules\Tenancy\Services\RestaurantService;

/**
 * Valid format, not reserved, not used by another restaurant.
 */
class AvailableSlug implements ValidationRule
{
    public function __construct(private readonly ?string $ignoreRestaurantId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $reason = app(RestaurantService::class)->slugProblem((string) $value, $this->ignoreRestaurantId);

        if ($reason) {
            $fail($reason);
        }
    }
}
