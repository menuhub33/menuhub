<?php

namespace Modules\Tenancy\Services;

use Illuminate\Support\Facades\DB;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Users\Models\User;
use Modules\Users\Services\UserService;

class StaffService
{
    public function __construct(private readonly UserService $users) {}

    /**
     * Adds an existing account (by e-mail) to the restaurant, or creates the
     * account when a name + password are supplied (no invitation e-mails yet).
     *
     * @param  array{email:string,role:string,full_name?:?string,password?:?string,phone?:?string}  $data
     */
    public function add(Restaurant $restaurant, array $data): RestaurantUser
    {
        $email = strtolower(trim($data['email']));
        $role = RestaurantRole::from($data['role']);

        return DB::transaction(function () use ($restaurant, $email, $role, $data) {
            $user = User::query()->where('email', $email)->first();

            if (! $user) {
                if (empty($data['full_name']) || empty($data['password'])) {
                    throw ApiException::invalid('لا يوجد حساب بهذا البريد. أدخل الاسم وكلمة المرور لإنشاء حساب للموظف', 'USER_NOT_FOUND');
                }
                $user = $this->users->create([
                    'full_name' => $data['full_name'],
                    'email' => $email,
                    'password' => $data['password'],
                    'phone' => $data['phone'] ?? null,
                ], verified: true);
            } elseif (! $user->is_active) {
                throw ApiException::invalid('حساب هذا المستخدم معلّق', 'USER_SUSPENDED');
            }

            $existing = RestaurantUser::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing && $existing->is_active) {
                throw ApiException::conflict('هذا المستخدم عضو في الفريق بالفعل', 'ALREADY_MEMBER');
            }

            $this->assertStaffLimit($restaurant);

            if ($existing) {
                $existing->update(['role' => $role, 'is_active' => true]);

                return $existing->load('user');
            }

            return RestaurantUser::query()->create([
                'restaurant_id' => $restaurant->id,
                'user_id' => $user->id,
                'role' => $role,
                'is_active' => true,
            ])->load('user');
        });
    }

    /**
     * @param  array{role?:string,is_active?:bool}  $data
     */
    public function update(RestaurantUser $membership, User $actor, array $data): RestaurantUser
    {
        $this->assertEditable($membership, $actor);

        if (isset($data['is_active']) && $data['is_active'] && ! $membership->is_active) {
            $this->assertStaffLimit($membership->restaurant);
        }

        $membership->fill([
            'role' => isset($data['role']) ? RestaurantRole::from($data['role']) : $membership->role,
            'is_active' => $data['is_active'] ?? $membership->is_active,
        ])->save();

        return $membership->load('user');
    }

    public function remove(RestaurantUser $membership, User $actor): void
    {
        $this->assertEditable($membership, $actor);
        $membership->delete();
    }

    private function assertEditable(RestaurantUser $membership, User $actor): void
    {
        if ($membership->role === RestaurantRole::Owner) {
            throw ApiException::forbidden('لا يمكن تعديل أو إزالة مالك النشاط', 'OWNER_PROTECTED');
        }

        if ($membership->user_id === $actor->getKey()) {
            throw ApiException::invalid('لا يمكنك تعديل عضويتك بنفسك');
        }
    }

    private function assertStaffLimit(Restaurant $restaurant): void
    {
        if (app()->bound(EnforcesPlanLimits::class)) {
            app(EnforcesPlanLimits::class)->assertCanCreate($restaurant->id, EnforcesPlanLimits::STAFF);
        }
    }
}
