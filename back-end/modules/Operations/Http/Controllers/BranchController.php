<?php

namespace Modules\Operations\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Operations\Models\Branch;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\Restaurant;

class BranchController extends ApiController
{
    public function index(Restaurant $restaurant): JsonResponse
    {
        return $this->ok(Branch::query()->where('restaurant_id', $restaurant->id)->orderBy('created_at')->get());
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate($this->rules($restaurant));

        if (app()->bound(EnforcesPlanLimits::class)) {
            app(EnforcesPlanLimits::class)->assertCanCreate($restaurant->id, EnforcesPlanLimits::BRANCHES);
        }

        $branch = Branch::query()->create($data + ['restaurant_id' => $restaurant->id]);

        return $this->created($branch->refresh());
    }

    public function update(Request $request, Restaurant $restaurant, string $branch): JsonResponse
    {
        $model = $this->find($restaurant, $branch);
        $model->update($request->validate($this->rules($restaurant, $model->id, partial: true)));

        return $this->ok($model->refresh());
    }

    public function setStatus(Request $request, Restaurant $restaurant, string $branch): JsonResponse
    {
        $model = $this->find($restaurant, $branch);
        $model->update($request->validate(['is_active' => ['required', 'boolean']]));

        return $this->ok($model->refresh());
    }

    public function destroy(Restaurant $restaurant, string $branch): JsonResponse
    {
        $this->find($restaurant, $branch)->delete();

        return $this->noContent();
    }

    private function find(Restaurant $restaurant, string $id): Branch
    {
        return Branch::query()->where('restaurant_id', $restaurant->id)->findOrFail($id);
    }

    /** @return array<string, array<int, mixed>> */
    private function rules(Restaurant $restaurant, ?string $ignore = null, bool $partial = false): array
    {
        return [
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:150'],
            'slug' => [$partial ? 'sometimes' : 'required', 'string', 'max:100', 'regex:'.Slug::PATTERN,
                Rule::unique('branches', 'slug')->where('restaurant_id', $restaurant->id)->ignore($ignore)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
