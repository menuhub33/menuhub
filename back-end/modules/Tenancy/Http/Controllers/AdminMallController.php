<?php

namespace Modules\Tenancy\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Tenancy\Http\Resources\MallResource;
use Modules\Tenancy\Models\Mall;
use Modules\Tenancy\Services\MallService;
use Modules\Tenancy\Support\MallAccess;

class AdminMallController extends ApiController
{
    public function __construct(private readonly MallService $malls) {}

    public function index()
    {
        $malls = Mall::query()
            ->with(['managers.user:id,full_name,email'])
            ->latest('created_at')
            ->paginate($this->perPage());

        $malls->through(fn (Mall $mall) => MallResource::make($mall)->resolve());

        return $malls;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, creating: true);

        return $this->created(MallResource::make(
            $this->malls->create($data)->load('managers.user:id,full_name,email')
        )->resolve());
    }

    public function show(Mall $mall): JsonResponse
    {
        $mall->load('managers.user:id,full_name,email');

        return $this->ok(MallResource::make($mall)->resolve());
    }

    public function update(Request $request, Mall $mall): JsonResponse
    {
        $mall = $this->malls->update($mall, $this->validated($request));
        $mall->load('managers.user:id,full_name,email');

        return $this->ok(MallResource::make($mall)->resolve());
    }

    public function destroy(Mall $mall): JsonResponse
    {
        $mall->delete();

        return $this->noContent();
    }

    public function assignManager(Request $request, Mall $mall): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $this->malls->assignManager($mall, $data);
        $mall->load('managers.user:id,full_name,email');

        return $this->ok(MallResource::make($mall)->resolve());
    }

    /** The signed-in mall manager's own center. */
    public function current(Request $request): JsonResponse
    {
        $mall = MallAccess::membership($request->user())?->mall;
        if (! $mall) {
            throw ApiException::notFound('لا يوجد مول مرتبط بهذا الحساب');
        }

        $mall->load('managers.user:id,full_name,email');

        return $this->ok(MallResource::make($mall)->resolve());
    }

    public function updateCurrent(Request $request): JsonResponse
    {
        $mall = MallAccess::membership($request->user())?->mall;
        if (! $mall) {
            throw ApiException::notFound('لا يوجد مول مرتبط بهذا الحساب');
        }

        $mall = $this->malls->update($mall, $this->validated($request));
        $mall->load('managers.user:id,full_name,email');

        return $this->ok(MallResource::make($mall)->resolve());
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $creating = false): array
    {
        $rules = [
            'name' => [$creating ? 'required' : 'sometimes', 'required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'logo_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'cover_image_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'status' => ['sometimes', Rule::in(['PUBLISHED', 'UNPUBLISHED'])],
        ];

        if ($creating) {
            $rules['manager'] = ['nullable', 'array'];
            $rules['manager.full_name'] = ['required_with:manager', 'string', 'max:150'];
            $rules['manager.email'] = ['required_with:manager', 'email', 'max:255', 'unique:users,email'];
            $rules['manager.password'] = ['required_with:manager', 'string', 'min:8', 'max:128'];
            $rules['manager.phone'] = ['nullable', 'string', 'max:50'];
        }

        $data = $request->validate($rules);

        if ($creating && empty($data['slug'])) {
            unset($data['slug']);
        }

        return $data;
    }
}
