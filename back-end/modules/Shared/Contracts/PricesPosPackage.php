<?php

namespace Modules\Shared\Contracts;

use Modules\Shared\Enums\PosMode;

/**
 * Implemented by the Platform module (prices are edited in /admin/plans).
 * Finance only depends on this contract when it adds the POS package to a contract price.
 */
interface PricesPosPackage
{
    /**
     * Yearly price of a POS package. `OFF` is always free.
     *
     * @return array{amount: float, currency: string}
     */
    public function priceFor(PosMode $mode): array;
}
