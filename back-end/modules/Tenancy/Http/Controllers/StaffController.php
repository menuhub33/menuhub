<?php

namespace Modules\Tenancy\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Tenancy\Services\StaffService;

class StaffController extends ApiController
{
    /** Staff can be MANAGER or EDITOR; the single OWNER is set by an admin. */
    private const ASSIGNABLE = ['MANAGER', 'EDITOR'];

    public function __construct(private readonly StaffService $staff) {}

    public function index(Restaurant $restaurant): JsonResponse
    {
        $members = $restaurant->memberships()->with('user')->orderBy('created_at')->get();

        return $this->ok($members->map(fn (RestaurantUser $m) => $this->present($m)));
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', Rule::in(self::ASSIGNABLE)],
            'full_name' => ['nullable', 'string', 'max:150'],
            'password' => ['nullable', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        return $this->created($this->present($this->staff->add($restaurant, $data)));
    }

    public function update(Request $request, Restaurant $restaurant, RestaurantUser $membership): JsonResponse
    {
        $data = $request->validate([
            'role' => ['sometimes', Rule::in(self::ASSIGNABLE)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return $this->ok($this->present($this->staff->update($membership, $request->user(), $data)));
    }

    public function destroy(Request $request, Restaurant $restaurant, RestaurantUser $membership): JsonResponse
    {
        $this->staff->remove($membership, $request->user());

        return $this->noContent();
    }

    private function present(RestaurantUser $membership): array
    {
        return [
            'id' => $membership->id,
            'role' => $membership->role->value,
            'is_active' => $membership->is_active,
            'user' => [
                'id' => $membership->user->id,
                'full_name' => $membership->user->full_name,
                'email' => $membership->user->email,
                'phone' => $membership->user->phone,
            ],
            'created_at' => $membership->created_at?->toIso8601String(),
        ];
    }
}
