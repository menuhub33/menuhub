<?php

namespace Modules\Sales\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Modules\Sales\Services\SalesReportService;
use Modules\Sales\Support\BranchScope;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class ReportController extends ApiController
{
    public function __construct(private readonly SalesReportService $reports) {}

    public function summary(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->summary($restaurant, $from, $to, $branch));
    }

    public function timeseries(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);
        $granularity = $request->validate(['granularity' => ['nullable', Rule::in(['day', 'hour'])]])['granularity'] ?? 'day';

        return $this->ok($this->reports->timeseries($restaurant, $from, $to, $branch, $granularity));
    }

    public function channels(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->distribution($restaurant, $from, $to, $branch, 'channel'));
    }

    public function orderTypes(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->distribution($restaurant, $from, $to, $branch, 'order_type'));
    }

    public function paymentMethods(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->paymentMethods($restaurant, $from, $to, $branch));
    }

    public function products(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);
        $options = $request->validate([
            'order' => ['nullable', Rule::in(['top', 'bottom'])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return $this->ok($this->reports->products(
            $restaurant, $from, $to, $branch,
            ($options['order'] ?? 'top') === 'bottom' ? 'asc' : 'desc',
            (int) ($options['limit'] ?? 20),
        ));
    }

    public function categories(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->categories($restaurant, $from, $to, $branch));
    }

    public function staff(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->staff($restaurant, $from, $to, $branch));
    }

    public function branches(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to, $branch] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->branches($restaurant, $from, $to, $branch));
    }

    /** The signed-in cashier's own collections. */
    public function myCollections(Request $request, Restaurant $restaurant): JsonResponse
    {
        [$from, $to] = $this->scope($request, $restaurant);

        return $this->ok($this->reports->collectionsOf($restaurant, $from, $to, (string) $request->user()->getKey()));
    }

    /** @return array{0: Carbon, 1: Carbon, 2: ?string} */
    private function scope(Request $request, Restaurant $restaurant): array
    {
        $filters = $request->validate([
            'period' => ['nullable', Rule::in(SalesReportService::PERIODS)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'uuid'],
        ]);

        [$from, $to] = $this->reports->range($restaurant, $filters['period'] ?? 'today', $filters['from'] ?? null, $filters['to'] ?? null);

        // A member pinned to a branch can never widen the scope.
        $pinned = BranchScope::memberBranch();
        $branch = $filters['branch_id'] ?? null;
        if ($pinned !== null && $branch !== null && $branch !== $pinned) {
            throw ApiException::forbidden('هذا الفرع غير متاح لك', 'BRANCH_FORBIDDEN');
        }

        return [$from, $to, $pinned ?? $branch];
    }
}
