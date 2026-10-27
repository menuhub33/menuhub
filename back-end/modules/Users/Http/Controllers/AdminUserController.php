<?php

namespace Modules\Users\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Modules\Shared\Enums\PlatformRole;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Users\Http\Resources\UserResource;
use Modules\Users\Models\User;
use Modules\Users\Services\UserService;

/**
 * Platform administration of accounts (/admin/users).
 */
class AdminUserController extends ApiController
{
    public function __construct(private readonly UserService $users) {}

    public function index(Request $request)
    {
        $query = User::query()
            ->search($request->query('q'))
            ->when($request->filled('role'), fn ($q) => $q->where('platform_role', $request->query('role')))
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->latest();

        return UserResource::collection($query->paginate($this->perPage()));
    }

    public function show(User $user): JsonResponse
    {
        return $this->ok(new UserResource($user));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:50'],
            'platform_role' => ['required', Rule::enum(PlatformRole::class)],
        ]);

        $role = PlatformRole::from($data['platform_role']);
        $this->users->assertCanManage($request->user(), null, $role);

        $user = $this->users->create($data, $role, verified: true);

        return $this->created(new UserResource($user));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'platform_role' => ['sometimes', Rule::enum(PlatformRole::class)],
            'password' => ['sometimes', Password::min(8)],
        ]);

        return $this->ok(new UserResource($this->users->update($request->user(), $user, $data)));
    }

    public function setActive(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);

        return $this->ok(new UserResource($this->users->setActive($request->user(), $user, $data['is_active'])));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->users->delete($request->user(), $user);

        return $this->noContent();
    }
}
