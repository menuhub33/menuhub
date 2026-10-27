<?php

namespace Modules\Tenancy\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\ReservedSubdomain;

/**
 * Sub-domains an administrator reserved on top of the built-in list
 * (`config('menuhub.reserved_subdomains')`); restaurants cannot use them as slug.
 */
class ReservedSubdomainController extends ApiController
{
    public function index(): JsonResponse
    {
        return $this->ok(ReservedSubdomain::query()->orderBy('slug')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->merge(['slug' => strtolower(trim((string) $request->input('slug')))]);

        $data = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'regex:'.Slug::PATTERN, 'unique:reserved_subdomains,slug'],
        ]);

        return $this->created(ReservedSubdomain::query()->create($data)->refresh());
    }

    public function update(Request $request, ReservedSubdomain $reserved): JsonResponse
    {
        $request->merge(['slug' => strtolower(trim((string) $request->input('slug')))]);

        $data = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'regex:'.Slug::PATTERN,
                Rule::unique('reserved_subdomains', 'slug')->ignore($reserved->id)],
        ]);

        $reserved->update($data);

        return $this->ok($reserved->refresh());
    }

    public function destroy(ReservedSubdomain $reserved): JsonResponse
    {
        $reserved->delete();

        return $this->noContent();
    }
}
