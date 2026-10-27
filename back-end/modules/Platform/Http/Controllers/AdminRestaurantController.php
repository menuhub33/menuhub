<?php

namespace Modules\Platform\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Finance\Models\MenuBilling;
use Modules\Platform\Services\DemoCatalogService;
use Modules\Platform\Services\ProvisioningService;
use Modules\Platform\Services\RestaurantAdminService;
use Modules\Platform\Support\DemoData;
use Modules\Shared\Enums\BusinessType;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Http\Resources\RestaurantResource;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Tenancy\Rules\AvailableSlug;

class AdminRestaurantController extends ApiController
{
    public function __construct(
        private readonly ProvisioningService $provisioning,
        private readonly RestaurantAdminService $admin,
        private readonly DemoCatalogService $demos,
    ) {}

    public function index(Request $request)
    {
        $restaurants = Restaurant::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $request->query('search')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('slug', 'like', $term));
            })
            ->latest('created_at')
            ->paginate($this->perPage());

        $owners = RestaurantUser::query()
            ->with('user:id,full_name,email')
            ->whereIn('restaurant_id', $restaurants->pluck('id'))
            ->where('role', 'OWNER')
            ->get()
            ->unique('restaurant_id')
            ->keyBy('restaurant_id');

        $restaurants->through(fn (Restaurant $r) => array_merge(
            RestaurantResource::make($r)->resolve(),
            [
                'owner_name' => $owners[$r->id]->user?->full_name ?? null,
                'owner_email' => $owners[$r->id]->user?->email ?? null,
            ],
        ));

        return $restaurants;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
            'slug' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:2000'],
            'business_type' => ['nullable', Rule::enum(BusinessType::class)],
            'billing' => ['nullable', 'array'],
            'billing.price' => ['required_with:billing', 'numeric', 'min:0'],
            'billing.setup_cost' => ['nullable', 'numeric', 'min:0'],
            'billing.annual_renewal' => ['nullable', 'numeric', 'min:0'],
            'billing.discount_type' => ['required_with:billing', Rule::enum(DiscountType::class)],
            'billing.discount_value' => ['nullable', 'numeric', 'min:0'],
            'billing.installments_count' => ['nullable', 'integer', 'min:1', 'max:24'],
            'billing.starts_on' => ['required_with:billing', 'date_format:Y-m-d'],
            'billing.currency' => ['nullable', Rule::in(config('menuhub.currencies'))],
            'billing.notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (isset($data['billing'])) {
            $type = $data['billing']['discount_type'];
            $value = (float) ($data['billing']['discount_value'] ?? 0);
            if (($type === 'PERCENT' && $value > 100) || ($type === 'AMOUNT' && $value > (float) $data['billing']['price'])) {
                return response()->json(['message' => 'قيمة الخصم غير صالحة'], 422);
            }
        }

        return $this->created(RestaurantResource::make($this->provisioning->create($data))->resolve());
    }

    public function show(Restaurant $restaurant): JsonResponse
    {
        $restaurant->load('memberships.user:id,full_name,email');
        $billing = MenuBilling::query()->with('installments')->where('restaurant_id', $restaurant->id)->first();

        return $this->ok([
            'restaurant' => RestaurantResource::make($restaurant)->resolve(),
            'staff' => $restaurant->memberships->map(fn ($m) => [
                'id' => $m->id, 'role' => $m->role->value, 'is_active' => $m->is_active,
                'user' => ['id' => $m->user?->id, 'full_name' => $m->user?->full_name, 'email' => $m->user?->email],
            ])->values(),
            'billing' => $billing,
        ]);
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', new AvailableSlug($restaurant->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::enum(RestaurantStatus::class)],
            'business_type' => ['sometimes', Rule::enum(BusinessType::class)],
        ]);

        if (isset($data['slug'])) {
            $data['slug'] = strtolower(trim($data['slug']));
        }

        $status = isset($data['status']) ? RestaurantStatus::from($data['status']) : $restaurant->status;
        $attributes = array_diff_key($data, ['status' => 1]);

        return $this->ok(RestaurantResource::make($this->admin->setStatus($restaurant, $status, $attributes))->resolve());
    }

    public function setStatus(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::enum(RestaurantStatus::class)]]);

        return $this->ok(RestaurantResource::make(
            $this->admin->setStatus($restaurant, RestaurantStatus::from($data['status']))
        )->resolve());
    }

    public function setBusinessType(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate(['business_type' => ['required', Rule::enum(BusinessType::class)]]);

        return $this->ok(RestaurantResource::make(
            $this->admin->setBusinessType($restaurant, $data['business_type'])
        )->resolve());
    }

    public function destroy(Restaurant $restaurant): JsonResponse
    {
        $restaurant->delete();

        return $this->noContent();
    }

    public function seedDemo(string $slug): JsonResponse
    {
        abort_unless(in_array($slug, DemoData::KEYS, true), 404, 'المنيو التجريبي غير معروف');

        return $this->ok(['slug' => $this->demos->seed($slug)->slug]);
    }
}
