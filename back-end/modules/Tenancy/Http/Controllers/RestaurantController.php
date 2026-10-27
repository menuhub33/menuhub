<?php

namespace Modules\Tenancy\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Tenancy\Http\Resources\RestaurantResource;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Tenancy\Rules\AvailableSlug;
use Modules\Tenancy\Services\RestaurantService;
use Modules\Tenancy\Support\TenantContext;

class RestaurantController extends ApiController
{
    public function __construct(private readonly RestaurantService $restaurants) {}

    /** Restaurants the signed-in user belongs to (account switcher). */
    public function mine(Request $request): JsonResponse
    {
        $memberships = RestaurantUser::query()
            ->with('restaurant')
            ->where('user_id', $request->user()->getKey())
            ->where('is_active', true)
            ->get()
            ->map(fn (RestaurantUser $membership) => [
                'id' => $membership->id,
                'role' => $membership->role->value,
                'restaurant' => new RestaurantResource($membership->restaurant),
            ]);

        return $this->ok($memberships);
    }

    public function show(Restaurant $restaurant): JsonResponse
    {
        $tenant = TenantContext::current();

        return $this->ok([
            'restaurant' => new RestaurantResource($restaurant),
            'role' => $tenant->viaAdmin ? 'ADMIN' : $tenant->role?->value,
            'permissions' => $tenant->permissions(),
            'is_operational' => $restaurant->isOperational(),
            'plan' => app()->bound(EnforcesPlanLimits::class)
                ? app(EnforcesPlanLimits::class)->summary($restaurant->id)
                : null,
        ]);
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', new AvailableSlug($restaurant->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'logo_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'cover_image_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'timezone' => ['sometimes', 'timezone:all'],
            'default_language' => ['sometimes', 'string', 'max:10'],
            'currency' => ['sometimes', Rule::in(config('menuhub.currencies'))],
            'delivery_enabled' => ['sometimes', 'boolean'],
            'chatbot_enabled' => ['sometimes', 'boolean'],
            'chatbot_name' => ['nullable', 'string', 'max:80'],
            'chatbot_welcome' => ['nullable', 'string', 'max:500'],
        ]);

        if (isset($data['slug'])) {
            $data['slug'] = strtolower(trim($data['slug']));
        }

        return $this->ok(new RestaurantResource($this->restaurants->update($restaurant, $data)));
    }

    /** Public: is this slug free? (used while an admin types the URL). */
    public function checkSlug(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:100'],
            'ignore' => ['nullable', 'uuid'],
        ]);

        $reason = $this->restaurants->slugProblem($data['slug'], $data['ignore'] ?? null);

        return $this->ok(['available' => $reason === null, 'reason' => $reason]);
    }
}
