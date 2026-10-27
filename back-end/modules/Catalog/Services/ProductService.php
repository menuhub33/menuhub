<?php

namespace Modules\Catalog\Services;

use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Option;
use Modules\Catalog\Models\OptionGroup;
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
    private const FILLABLE = [
        'category_id', 'name_ar', 'name_en', 'description_ar', 'description_en',
        'price', 'old_price', 'currency', 'sort_order', 'status', 'is_featured',
    ];

    public function __construct(private readonly PlanGuard $limits) {}

    /** @param  array<string, mixed>  $data */
    public function create(Restaurant $restaurant, array $data): Product
    {
        $category = $this->categoryOf($restaurant, $data['category_id']);
        $this->limits->creating($restaurant->id, EnforcesPlanLimits::PRODUCTS);

        return DB::transaction(function () use ($restaurant, $category, $data) {
            $product = Product::query()->create([
                ...array_intersect_key($data, array_flip(self::FILLABLE)),
                'category_id' => $category->id,
                'currency' => $data['currency'] ?? $restaurant->currency,
                'status' => $data['status'] ?? ProductStatus::Available->value,
                'sort_order' => $data['sort_order']
                    ?? (int) Product::query()->where('category_id', $category->id)->max('sort_order') + 1,
            ]);

            foreach ($data['images'] ?? [] as $index => $image) {
                $this->addImage($product, [
                    'image_url' => $image['image_url'],
                    'sort_order' => $image['sort_order'] ?? $index,
                    'is_primary' => $image['is_primary'] ?? $index === 0,
                ]);
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

        $product->fill(array_intersect_key($data, array_flip(self::FILLABLE)))->save();

        return $product->refresh();
    }

    public function setStatus(Product $product, ProductStatus $status): Product
    {
        $product->forceFill(['status' => $status])->save();

        return $product;
    }

    /**
     * Copies the product with its gallery, option groups and options.
     */
    public function duplicate(Product $product, Restaurant $restaurant): Product
    {
        $this->limits->creating($restaurant->id, EnforcesPlanLimits::PRODUCTS);

        return DB::transaction(function () use ($product) {
            $copy = $product->replicate(['created_at', 'updated_at']);
            $copy->name_ar = $product->name_ar.' (نسخة)';
            $copy->name_en = $product->name_en ? $product->name_en.' (copy)' : null;
            $copy->sort_order = (int) Product::query()->where('category_id', $product->category_id)->max('sort_order') + 1;
            $copy->save();

            foreach ($product->images as $image) {
                ProductImage::query()->create([
                    'product_id' => $copy->id,
                    'image_url' => $image->image_url,
                    'sort_order' => $image->sort_order,
                    'is_primary' => $image->is_primary,
                ]);
            }

            foreach ($product->optionGroups()->with('options')->get() as $group) {
                $newGroup = $group->replicate(['created_at', 'updated_at']);
                $newGroup->product_id = $copy->id;
                $newGroup->save();

                foreach ($group->options as $option) {
                    $newOption = $option->replicate(['created_at', 'updated_at']);
                    $newOption->option_group_id = $newGroup->id;
                    $newOption->save();
                }
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
            $hasImages = ProductImage::query()->where('product_id', $product->id)->exists();
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
    public function saveOptionGroup(Product $product, array $data, ?OptionGroup $group = null): OptionGroup
    {
        $group ??= new OptionGroup(['product_id' => $product->id]);

        $required = (bool) ($data['is_required'] ?? $group->is_required ?? false);
        $type = $data['selection_type'] ?? $group->selection_type?->value ?? 'SINGLE';
        $min = (int) ($data['min_selection'] ?? $group->min_selection ?? 0);
        $max = array_key_exists('max_selection', $data) ? $data['max_selection'] : $group->max_selection;

        if ($required && $min < 1) {
            $min = 1;
        }
        if ($type === 'SINGLE') {
            $max = 1;
            $min = min($min, 1);
        }
        if ($max !== null && $max < $min) {
            throw ApiException::invalid('الحد الأقصى لا يمكن أن يقل عن الحد الأدنى');
        }

        $group->fill([
            'name_ar' => $data['name_ar'] ?? $group->name_ar,
            'name_en' => array_key_exists('name_en', $data) ? $data['name_en'] : $group->name_en,
            'selection_type' => $type,
            'is_required' => $required,
            'min_selection' => $min,
            'max_selection' => $max,
            'sort_order' => $data['sort_order'] ?? $group->sort_order
                ?? (int) OptionGroup::query()->where('product_id', $product->id)->max('sort_order') + 1,
        ])->save();

        return $group->refresh();
    }

    /** @param  array<string, mixed>  $data */
    public function saveOption(OptionGroup $group, array $data, ?Option $option = null): Option
    {
        $option ??= new Option(['option_group_id' => $group->id]);

        $option->fill([
            'name_ar' => $data['name_ar'] ?? $option->name_ar,
            'name_en' => array_key_exists('name_en', $data) ? $data['name_en'] : $option->name_en,
            'price_delta' => $data['price_delta'] ?? $option->price_delta ?? 0,
            'is_active' => $data['is_active'] ?? $option->is_active ?? true,
            'sort_order' => $data['sort_order'] ?? $option->sort_order
                ?? (int) Option::query()->where('option_group_id', $group->id)->max('sort_order') + 1,
        ])->save();

        return $option->refresh();
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
