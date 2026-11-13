<?php

namespace Modules\Catalog\Http\Controllers;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Catalog\Http\Resources\ProductResource;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Services\ProductService;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Tenancy\Models\Restaurant;

class ProductController extends ApiController
{
    private const WITH = ['images', 'category:id,name_ar,name_en'];

    public function __construct(private readonly ProductService $products)
    {
        // Marks the request so the resource includes `cost_price` (only for members who may read it).
        // The public menu reuses the resource but never sets this, so costs can't leak.
        $this->middleware(function (Request $request, Closure $next) {
            if (ProductResource::memberCanSeeCost()) {
                $request->attributes->set(ProductResource::EXPOSE_COST, true);
            }

            return $next($request);
        });
    }
    public function index(Request $request, Restaurant $restaurant)
    {
        $request->validate([
            'category_id' => ['nullable', 'uuid'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'featured' => ['nullable', 'boolean'],
            'discounted' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $term = $request->query('q');

        $query = Product::query()->forRestaurant($restaurant->id)
            ->with(self::WITH)
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->query('category_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('featured'), fn ($q) => $q->where('is_featured', $request->boolean('featured')))
            ->when($request->boolean('discounted'), fn ($q) => $q->whereNotNull('old_price')->whereColumn('old_price', '>', 'price'))
            ->when($term, fn ($q) => $q->where(fn ($w) => $w
                ->where('name_ar', 'like', "%{$term}%")
                ->orWhere('name_en', 'like', "%{$term}%")))
            ->orderBy('sort_order')->orderBy('created_at');

        return ProductResource::collection($query->paginate($this->perPage(50)));
    }

    public function show(Restaurant $restaurant, Product $product): JsonResponse
    {
        return $this->ok(new ProductResource($product->load(self::WITH)));
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate(['category_id' => ['required', 'uuid']] + $this->rules());

        $product = $this->products->create($restaurant, $this->withoutCostUnlessAllowed($data));

        return $this->created(new ProductResource($product->load(self::WITH)));
    }

    public function update(Request $request, Restaurant $restaurant, Product $product): JsonResponse
    {
        $data = $request->validate(['category_id' => ['sometimes', 'uuid']] + $this->rules(partial: true));

        $product = $this->products->update($product, $restaurant, $this->withoutCostUnlessAllowed($data));

        return $this->ok(new ProductResource($product->load(self::WITH)));
    }

    public function setStatus(Request $request, Restaurant $restaurant, Product $product): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::enum(ProductStatus::class)]]);

        return $this->ok(new ProductResource($this->products->setStatus($product, ProductStatus::from($data['status']))));
    }

    public function duplicate(Restaurant $restaurant, Product $product): JsonResponse
    {
        $copy = $this->products->duplicate($product, $restaurant);

        return $this->created(new ProductResource($copy->load(self::WITH)));
    }

    public function reorder(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.id' => ['required', 'uuid'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $this->products->reorder($restaurant, $data['items']);

        return $this->message('تم تحديث الترتيب');
    }

    public function destroy(Restaurant $restaurant, Product $product): JsonResponse
    {
        $product->delete();

        return $this->noContent();
    }

    /**
     * Only roles that can read sales reports may set a product's cost.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withoutCostUnlessAllowed(array $data): array
    {
        if (! ProductResource::memberCanSeeCost()) {
            unset($data['cost_price']);
        }

        return $data;
    }

    /** @return array<string, array<int, mixed>> */
    private function rules(bool $partial = false): array
    {
        $required = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'name_ar' => [...$required, 'string', 'max:200'],
            'name_en' => ['nullable', 'string', 'max:200'],
            'description_ar' => ['nullable', 'string', 'max:5000'],
            'description_en' => ['nullable', 'string', 'max:5000'],
            // The selling price is mandatory: showing or hiding prices is a menu-level switch, not an empty price.
            'price' => [$partial ? 'sometimes' : 'required', 'numeric', 'min:0', 'max:9999999999'],
            // Cost is mandatory for the members who can see it (the others never send it).
            'cost_price' => ProductResource::memberCanSeeCost()
                ? [$partial ? 'sometimes' : 'required', 'numeric', 'min:0', 'max:9999999999']
                : ['nullable'], // ignored: stripped before saving
            'old_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'currency' => ['sometimes', Rule::in(config('menuhub.currencies'))],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::enum(ProductStatus::class)],
            'is_featured' => ['sometimes', 'boolean'],
            'stock_quantity' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000000'],
            'images' => ['sometimes', 'array', 'max:'.ProductService::MAX_IMAGES],
            'images.*.image_url' => ['required_with:images', 'string', 'max:2000', new ImageUrl],
            'images.*.sort_order' => ['sometimes', 'integer', 'min:0'],
            'images.*.is_primary' => ['sometimes', 'boolean'],
        ];
    }
}
