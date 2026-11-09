<?php

namespace Modules\Catalog\Services;

use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductImage;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Reorder;
use Modules\Tenancy\Models\Restaurant;

class ProductService
{
    /** Hard ceiling so a plan edit cannot accept an unbounded gallery. */
    public const MAX_IMAGES = 12;

    /** Used when the plan does not set max_product_images. */
    public const DEFAULT_IMAGE_LIMIT = 4;

    private const FILLABLE = [
        'category_id', 'name_ar', 'name_en', 'description_ar', 'description_en',
        'price', 'old_price', 'currency', 'sort_order', 'status', 'is_featured', 'stock_quantity',
    ];

    public function __construct(private readonly PlanGuard $limits) {}

    /** @param  array<string, mixed>  $data */
    public function create(Restaurant $restaurant, array $data): Product
    {
        $category = $this->categoryOf($restaurant, $data['category_id']);
        $this->guardDiscount($data);
        $this->limits->creating($restaurant->id, EnforcesPlanLimits::PRODUCTS);
        $this->assertImageRoom($restaurant->id, count($data['images'] ?? []));

        return DB::transaction(function () use ($restaurant, $category, $data) {
            $hasPosition = array_key_exists('sort_order', $data);
            $position = $hasPosition ? max(0, (int) $data['sort_order']) : null;

            $product = Product::query()->create([
                ...array_intersect_key($data, array_flip(self::FILLABLE)),
                'category_id' => $category->id,
                'currency' => $data['currency'] ?? $restaurant->currency,
                'status' => $data['status'] ?? ProductStatus::Available->value,
                'sort_order' => (int) Product::query()->where('category_id', $category->id)->max('sort_order') + 1,
            ]);

            foreach ($data['images'] ?? [] as $index => $image) {
                $this->addImage($product, [
                    'image_url' => $image['image_url'],
                    'sort_order' => $image['sort_order'] ?? $index,
                    'is_primary' => $image['is_primary'] ?? $index === 0,
                ]);
            }

            if ($position !== null) {
                Reorder::place(Product::query()->where('category_id', $category->id), $product->id, $position);
                $product->refresh();
            }

            return $product;
        });
    }

    /** @param  array<string, mixed>  $data */
    public function update(Product $product, Restaurant $restaurant, array $data): Product
    {
        if (isset($data['category_id']) && $data['category_id'] !== $product->category_id) {
            $data['category_id'] = $this->categoryOf($restaurant, $data['category_id'])->id;
        }

        $this->guardDiscount($data, $product);
        $hasPosition = array_key_exists('sort_order', $data);
        $position = $hasPosition ? max(0, (int) $data['sort_order']) : null;
        unset($data['sort_order']);

        $previousCategoryId = $product->category_id;
        $product->fill(array_intersect_key($data, array_flip(self::FILLABLE)))->save();

        if ($previousCategoryId !== $product->category_id) {
            Reorder::normalize(Product::query()->where('category_id', $previousCategoryId));
        }

        if ($hasPosition) {
            Reorder::place(
                Product::query()->where('category_id', $product->category_id),
                $product->id,
                $position
            );
            RestaurantContentChanged::dispatch($restaurant->id);
        }

        return $product->refresh();
    }

    public function setStatus(Product $product, ProductStatus $status): Product
    {
        $product->forceFill(['status' => $status])->save();

        return $product;
    }

    /**
     * Copies the product with its gallery.
     */
    public function duplicate(Product $product, Restaurant $restaurant): Product
    {
        $this->limits->creating($restaurant->id, EnforcesPlanLimits::PRODUCTS);

        return DB::transaction(function () use ($product, $restaurant) {
            $copy = $product->replicate(['created_at', 'updated_at']);
            $copy->name_ar = $product->name_ar.' (نسخة)';
            $copy->name_en = $product->name_en ? $product->name_en.' (copy)' : null;
            $copy->sort_order = (int) Product::query()->where('category_id', $product->category_id)->max('sort_order') + 1;
            $copy->save();

            $limit = $this->imageLimit($restaurant->id);
            foreach ($product->images->take($limit) as $image) {
                ProductImage::query()->create([
                    'product_id' => $copy->id,
                    'image_url' => $image->image_url,
                    'sort_order' => $image->sort_order,
                    'is_primary' => $image->is_primary,
                ]);
            }

            return $copy;
        });
    }

    /** @param  list<array{id:string,sort_order:int}>  $items */
    public function reorder(Restaurant $restaurant, array $items): void
    {
        Reorder::apply(Product::query()->forRestaurant($restaurant->id), $items);
        RestaurantContentChanged::dispatch($restaurant->id);
    }

    /** @param  array{image_url:string,sort_order?:int,is_primary?:bool}  $data */
    public function addImage(Product $product, array $data): ProductImage
    {
        return DB::transaction(function () use ($product, $data) {
            $count = ProductImage::query()->where('product_id', $product->id)->lockForUpdate()->count();
            $this->assertImageRoom($product->restaurantId(), $count + 1);

            $hasImages = $count > 0;
            $primary = ! $hasImages || ($data['is_primary'] ?? false);

            if ($primary) {
                ProductImage::query()->where('product_id', $product->id)->update(['is_primary' => false]);
            }

            return ProductImage::query()->create([
                'product_id' => $product->id,
                'image_url' => $data['image_url'],
                'sort_order' => $data['sort_order']
                    ?? (int) ProductImage::query()->where('product_id', $product->id)->max('sort_order') + 1,
                'is_primary' => $primary,
            ]);
        });
    }

    /** @param  array<string, mixed>  $data */
    public function updateImage(ProductImage $image, array $data): ProductImage
    {
        return DB::transaction(function () use ($image, $data) {
            if (($data['is_primary'] ?? false) && ! $image->is_primary) {
                ProductImage::query()->where('product_id', $image->product_id)->update(['is_primary' => false]);
            }

            $image->fill(array_intersect_key($data, array_flip(['image_url', 'sort_order', 'is_primary'])))->save();

            return $image->refresh();
        });
    }

    public function deleteImage(ProductImage $image): void
    {
        DB::transaction(function () use ($image) {
            $wasPrimary = $image->is_primary;
            $productId = $image->product_id;
            $image->delete();

            if ($wasPrimary) {
                ProductImage::query()->where('product_id', $productId)
                    ->orderBy('sort_order')->first()?->update(['is_primary' => true]);
            }
        });
    }

    /** @param  array<string, mixed>  $data */
    private function guardDiscount(array $data, ?Product $existing = null): void
    {
        if (! array_key_exists('old_price', $data) && ! array_key_exists('price', $data)) {
            return;
        }

        $price = array_key_exists('price', $data) ? $data['price'] : $existing?->price;
        $old = array_key_exists('old_price', $data) ? $data['old_price'] : $existing?->old_price;

        if ($old === null || $old === '' || $price === null || $price === '') {
            return;
        }

        if ((float) $old <= (float) $price) {
            throw ApiException::invalid('السعر قبل الحسم يجب أن يكون أكبر من السعر الحالي', 'INVALID_DISCOUNT');
        }
    }

    private function assertImageRoom(?string $restaurantId, int $total): void
    {
        $max = $this->imageLimit($restaurantId);
        if ($total > $max) {
            throw ApiException::invalid(
                'يمكن إضافة '.$max.' صور كحد أقصى لكل منتج',
                'PRODUCT_IMAGE_LIMIT',
            );
        }
    }

    private function imageLimit(?string $restaurantId): int
    {
        $fromPlan = $restaurantId ? $this->limits->productImageLimit($restaurantId) : null;
        $limit = $fromPlan ?? self::DEFAULT_IMAGE_LIMIT;

        return max(1, min(self::MAX_IMAGES, $limit));
    }

    private function categoryOf(Restaurant $restaurant, string $categoryId): Category
    {
        $category = Category::query()->forRestaurant($restaurant->id)->find($categoryId);

        if (! $category) {
            throw ApiException::invalid('التصنيف غير موجود', 'CATEGORY_NOT_FOUND');
        }

        return $category;
    }
}
