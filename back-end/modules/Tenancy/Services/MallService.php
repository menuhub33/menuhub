<?php

namespace Modules\Tenancy\Services;

use Illuminate\Support\Facades\DB;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\Mall;
use Modules\Tenancy\Models\MallUser;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;
use Modules\Users\Services\UserService;

class MallService
{
    public function __construct(
        private readonly RestaurantService $restaurants,
        private readonly UserService $users,
    ) {}

    public function slugProblem(string $slug, ?string $ignoreMallId = null): ?string
    {
        $slug = strtolower(trim($slug));

        if (! Slug::isValid($slug)) {
            return 'صيغة الرابط غير صحيحة. استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات';
        }

        if ($this->restaurants->isReserved($slug)) {
            return 'هذا الرابط محجوز ولا يمكن استخدامه';
        }

        if (Restaurant::query()->where('slug', $slug)->exists()) {
            return 'هذا الرابط مستخدم لمنيو محل';
        }

        $taken = Mall::query()
            ->where('slug', $slug)
            ->when($ignoreMallId, fn ($q) => $q->where('id', '!=', $ignoreMallId))
            ->exists();

        return $taken ? 'هذا الرابط مستخدم لمركز آخر' : null;
    }

    public function uniqueSlug(string $base): string
    {
        $base = $base !== '' ? strtolower($base) : Slug::fromName('');
        $slug = $base;

        for ($attempt = 2; $attempt <= 25; $attempt++) {
            if ($this->slugProblem($slug) === null) {
                return $slug;
            }
            $slug = "{$base}-{$attempt}";
        }

        return $base.'-'.substr((string) time(), -6);
    }

    /** @param  array<string, mixed>  $input */
    public function create(array $input): Mall
    {
        return DB::transaction(function () use ($input) {
            $slug = $this->uniqueSlug(
                ! empty($input['slug']) ? strtolower(trim((string) $input['slug'])) : Slug::fromName($input['name'])
            );

            $mall = Mall::query()->create([
                'name' => trim($input['name']),
                'slug' => $slug,
                'description' => $input['description'] ?? null,
                'phone' => $input['phone'] ?? null,
                'email' => isset($input['email']) ? strtolower(trim((string) $input['email'])) : null,
                'address' => $input['address'] ?? null,
                'logo_url' => $input['logo_url'] ?? null,
                'cover_image_url' => $input['cover_image_url'] ?? null,
                'status' => 'UNPUBLISHED',
            ]);

            if (! empty($input['manager'])) {
                $this->assignManager($mall, $input['manager']);
            }

            return $mall->refresh();
        });
    }

    /** @param  array{full_name: string, email: string, password: string, phone?: ?string}  $input */
    public function assignManager(Mall $mall, array $input): MallUser
    {
        if ($mall->managers()->where('is_active', true)->exists()) {
            throw ApiException::conflict('لهذا المول مدير بالفعل');
        }

        $manager = $this->users->create([
            'full_name' => $input['full_name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'phone' => $input['phone'] ?? null,
        ], verified: true);

        if (MallUser::query()->where('user_id', $manager->id)->exists()) {
            throw ApiException::conflict('هذا الحساب يدير مولًا آخر');
        }

        return MallUser::query()->create([
            'mall_id' => $mall->id,
            'user_id' => $manager->id,
            'role' => 'ADMIN',
            'is_active' => true,
        ]);
    }

    /** @param  array<string, mixed>  $input */
    public function update(Mall $mall, array $input): Mall
    {
        if (isset($input['slug'])) {
            $input['slug'] = strtolower(trim((string) $input['slug']));
            $problem = $this->slugProblem($input['slug'], $mall->id);
            if ($problem) {
                throw ApiException::invalid($problem, 'SLUG_TAKEN');
            }
        }

        $mall->fill(array_intersect_key($input, array_flip([
            'name', 'slug', 'description', 'phone', 'email', 'address',
            'logo_url', 'cover_image_url', 'status',
        ])));
        $mall->save();

        return $mall->refresh();
    }

    public function managesRestaurant(User $user, Restaurant $restaurant): bool
    {
        $link = MallUser::query()
            ->where('user_id', $user->getKey())
            ->where('is_active', true)
            ->first();

        return $link !== null && $restaurant->mall_id === $link->mall_id;
    }
}
