<?php

namespace Modules\Platform\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Platform\Services\PosPricing;
use Modules\Shared\Http\Controllers\ApiController;

/** Yearly prices of the optional POS packages (platform admins only). */
class PosPricingController extends ApiController
{
    public function __construct(private readonly PosPricing $pricing) {}

    public function show(): JsonResponse
    {
        return $this->ok($this->pricing->all());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cashier' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'cashier_waiter' => ['required', 'numeric', 'min:0', 'max:100000000'],
            'currency' => ['required', Rule::in(config('menuhub.currencies'))],
        ]);

        return $this->ok($this->pricing->update($data));
    }
}
