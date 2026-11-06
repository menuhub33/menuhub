<?php

namespace Modules\Platform\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Services\YearlyMenuSubscription;
use Modules\Platform\Services\DemoCatalogService;
use Modules\Platform\Services\ProvisioningService;
use Modules\Platform\Services\RestaurantAdminService;
use Modules\Platform\Support\DemoData;
use Modules\Shared\Enums\BusinessType;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Http\Resources\RestaurantResource;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Tenancy\Rules\AvailableSlug;
use Modules\Tenancy\Support\MallAccess;

class AdminRestaurantController extends ApiController
{
    public function __construct(
        private readonly ProvisioningService $provisioning,
        private readonly RestaurantAdminService $admin,
        private readonly DemoCatalogService $demos,
    ) {}

    public function index(Request $request)
    {
        $restaurants = MallAccess::scopeRestaurants(Restaurant::query(), $request->user())
            ->with('mall:id,name,slug')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $request->query('search')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('slug', 'like', $term));
            })
            ->latest('created_at')
            ->paginate($this->perPage());

        app(YearlyMenuSubscription::class)->closeDue($restaurants->getCollection()->pluck('id')->all());
        $restaurants->getCollection()->each(fn (Restaurant $restaurant) => $restaurant->refresh());

        $owners = RestaurantUser::query()
            ->with('user:id,full_name,email,password_visible')
            ->whereIn('restaurant_id', $restaurants->pluck('id'))
            ->where('role', 'OWNER')
            ->get()
            ->unique('restaurant_id')
            ->keyBy('restaurant_id');

        $restaurants->through(fn (Restaurant $r) => array_merge(
            RestaurantResource::make($r)->resolve(),
            [
                'owner_name' => $owners->get($r->id)?->user?->full_name,
                'owner_email' => $owners->get($r->id)?->user?->email,
                'owner_password' => $owners->get($r->id)?->user?->revealPassword(),
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
            'mall_id' => ['nullable', 'uuid', Rule::exists('malls', 'id')],
            'billing' => ['nullable', 'array'],
            'billing.plan_id' => ['nullable', 'uuid', 'exists:plans,id'],
            'billing.price' => ['nullable', 'numeric', 'min:0'],
            'billing.setup_cost' => ['nullable', 'numeric', 'min:0'],
            'billing.annual_renewal' => ['nullable', 'numeric', 'min:0'],
            'billing.discount_type' => ['required_with:billing', Rule::enum(DiscountType::class)],
            'billing.discount_value' => ['nullable', 'numeric', 'min:0'],
            'billing.installments_count' => ['nullable', 'integer', 'min:1', 'max:24'],
            'billing.starts_on' => ['required_with:billing', 'date_format:Y-m-d'],
            'billing.currency' => ['nullable', Rule::in(config('menuhub.currencies'))],
            'billing.notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $scoped = MallAccess::scopedMall($request->user());
        if ($scoped) {
            $data['mall_id'] = $scoped->id;
        }

        if (isset($data['billing']) && empty($data['billing']['plan_id']) && ! isset($data['billing']['price'])) {
            return response()->json(['message' => 'سعر المنيو أو الخطة مطلوب'], 422);
        }

        if (isset($data['billing']) && empty($data['billing']['plan_id'])) {
            $type = $data['billing']['discount_type'];
            $value = (float) ($data['billing']['discount_value'] ?? 0);
            if (($type === 'PERCENT' && $value > 100) || ($type === 'AMOUNT' && $value > (float) ($data['billing']['price'] ?? 0))) {
                return response()->json(['message' => 'قيمة الخصم غير صالحة'], 422);
            }
        }

        $restaurant = $this->provisioning->create($data)->load('mall:id,name,slug');

        return $this->created(RestaurantResource::make($restaurant)->resolve());
    }

    public function show(Request $request, Restaurant $restaurant): JsonResponse
    {
        MallAccess::assertRestaurant($request->user(), $restaurant);
        $restaurant->load(['memberships.user:id,full_name,email', 'mall:id,name,slug']);
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
        MallAccess::assertRestaurant($request->user(), $restaurant);

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', new AvailableSlug($restaurant->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::enum(RestaurantStatus::class)],
            'business_type' => ['sometimes', Rule::enum(BusinessType::class)],
        ];

        if (! MallAccess::limitsRestaurants($request->user())) {
            $rules['mall_id'] = ['sometimes', 'nullable', 'uuid', Rule::exists('malls', 'id')];
        }

        $data = $request->validate($rules);

        if (isset($data['slug'])) {
            $data['slug'] = strtolower(trim($data['slug']));
        }

        $leavingMall = array_key_exists('mall_id', $data) && $data['mall_id'] === null && $restaurant->mall_id !== null;
        $status = isset($data['status']) ? RestaurantStatus::from($data['status']) : $restaurant->status;
        $attributes = array_diff_key($data, ['status' => 1]);
        $saved = $this->admin->setStatus($restaurant, $status, $attributes)->load('mall:id,name,slug');

        if ($leavingMall) {
            $saved->ratings()->delete();
        }

        if ($request->exists('owner_email') || $request->filled('owner_password')) {
            $this->updateOwnerAccount($request, $saved);
        }

        return $this->ok(RestaurantResource::make($saved)->resolve());
    }

    private function updateOwnerAccount(Request $request, Restaurant $restaurant): void
    {
        $owner = $restaurant->owner();
        if (! $owner) {
            throw ApiException::invalid('لا يوجد مالك لهذا المطعم', 'OWNER_NOT_FOUND');
        }

        $account = $request->validate([
            'owner_email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($owner->id)],
            'owner_password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:128'],
        ]);

        if (isset($account['owner_email'])) {
            $email = strtolower(trim($account['owner_email']));
            if ($email !== strtolower($owner->email)) {
                $owner->email = $email;
                $owner->email_verified_at = now();
            }
        }

        if (! empty($account['owner_password'])) {
            $owner->password = $account['owner_password'];
        }

        $owner->save();
    }

    public function setStatus(Request $request, Restaurant $restaurant): JsonResponse
    {
        MallAccess::assertRestaurant($request->user(), $restaurant);
        $data = $request->validate(['status' => ['required', Rule::enum(RestaurantStatus::class)]]);

        return $this->ok(RestaurantResource::make(
            $this->admin->setStatus($restaurant, RestaurantStatus::from($data['status']))
        )->resolve());
    }

    public function setBusinessType(Request $request, Restaurant $restaurant): JsonResponse
    {
        MallAccess::assertRestaurant($request->user(), $restaurant);
        $data = $request->validate(['business_type' => ['required', Rule::enum(BusinessType::class)]]);

        return $this->ok(RestaurantResource::make(
            $this->admin->setBusinessType($restaurant, $data['business_type'])
        )->resolve());
    }

    public function destroy(Request $request, Restaurant $restaurant): JsonResponse
    {
        MallAccess::assertRestaurant($request->user(), $restaurant);
        $restaurant->delete();

        return $this->noContent();
    }

    public function seedDemo(string $slug): JsonResponse
    {
        abort_unless(in_array($slug, DemoData::KEYS, true), 404, 'المنيو التجريبي غير معروف');

        return $this->ok(['slug' => $this->demos->seed($slug)->slug]);
    }
}
