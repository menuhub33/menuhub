<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductImage;
use Modules\Catalog\Services\ProductService;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Tenancy\Models\Restaurant;

class ProductImageController extends ApiController
{
    public function __construct(private readonly ProductService $products) {}

    public function store(Request $request, Restaurant $restaurant, Product $product): JsonResponse
    {
        $data = $request->validate([
            'image_url' => ['required', 'string', 'max:2000', new ImageUrl],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        return $this->created($this->products->addImage($product, $data));
    }

    public function update(Request $request, Restaurant $restaurant, ProductImage $image): JsonResponse
    {
        $data = $request->validate([
            'image_url' => ['sometimes', 'string', 'max:2000', new ImageUrl],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        return $this->ok($this->products->updateImage($image, $data));
    }

    public function destroy(Restaurant $restaurant, ProductImage $image): JsonResponse
    {
        $this->products->deleteImage($image);

        return $this->noContent();
    }
}
