<?php

namespace Modules\Operations\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Operations\Models\Branch;
use Modules\Operations\Models\BusinessHour;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class BusinessHourController extends ApiController
{
    private const TIME = ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'];

    public function index(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate(['branch_id' => ['nullable', 'uuid']]);

        return $this->ok($this->hours($restaurant, $request->query('branch_id')));
    }

    /**
     * Replaces the whole weekly schedule of the restaurant (or of a branch).
     */
    public function sync(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'branch_id' => ['nullable', 'uuid'],
            'hours' => ['required', 'array', 'min:1', 'max:7'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'hours.*.is_closed' => ['sometimes', 'boolean'],
            'hours.*.open_time' => self::TIME,
            'hours.*.close_time' => self::TIME,
        ]);

        $branchId = $data['branch_id'] ?? null;
        if ($branchId && ! Branch::query()->where('restaurant_id', $restaurant->id)->whereKey($branchId)->exists()) {
            throw ApiException::invalid('الفرع غير موجود', 'BRANCH_NOT_FOUND');
        }

        foreach ($data['hours'] as $row) {
            if (! ($row['is_closed'] ?? false) && (empty($row['open_time']) || empty($row['close_time']))) {
                throw ApiException::invalid('حدّد وقت الفتح والإغلاق لكل يوم مفتوح', 'HOURS_INCOMPLETE');
            }
        }

        DB::transaction(function () use ($restaurant, $branchId, $data) {
            BusinessHour::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('branch_id', $branchId)
                ->delete();

            foreach ($data['hours'] as $row) {
                $closed = (bool) ($row['is_closed'] ?? false);
                BusinessHour::query()->create([
                    'restaurant_id' => $restaurant->id,
                    'branch_id' => $branchId,
                    'day_of_week' => $row['day_of_week'],
                    'is_closed' => $closed,
                    'open_time' => $closed ? null : $row['open_time'],
                    'close_time' => $closed ? null : $row['close_time'],
                ]);
            }
        });

        RestaurantContentChanged::dispatch($restaurant->id);

        return $this->ok($this->hours($restaurant, $branchId));
    }

    private function hours(Restaurant $restaurant, ?string $branchId)
    {
        return BusinessHour::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('branch_id', $branchId)
            ->orderBy('day_of_week')
            ->get();
    }
}
