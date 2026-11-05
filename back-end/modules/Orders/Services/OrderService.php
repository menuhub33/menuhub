<?php

namespace Modules\Orders\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Product;
use Modules\Finance\Services\YearlyMenuSubscription;
use Modules\Orders\Models\MenuComplaint;
use Modules\Orders\Models\Order;
use Modules\Orders\Models\OrderItem;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;

class OrderService
{
    /** @param  array<string, mixed>  $data */
    public function place(string $slug, array $data): Order
    {
        $restaurant = $this->openRestaurant($slug);
        $menu = $this->liveMenu($restaurant);
        $lines = $this->lines($restaurant, $menu, $data['items']);

        return DB::transaction(function () use ($restaurant, $data, $lines) {
            $total = 0;
            foreach ($lines as $line) {
                $total += $line['line_total'];
            }

            $order = Order::query()->create([
                'restaurant_id' => $restaurant->id,
                'number' => $this->nextNumber($restaurant->id),
                'status' => OrderStatus::Pending,
                'delivery_type' => $data['delivery_type'],
                'branch_name' => $data['branch_name'] ?? null,
                'table_number' => $data['table_number'] ?? null,
                'address' => $data['address'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'currency' => $lines[0]['currency'],
                'total' => $total,
            ]);

            foreach ($lines as $line) {
                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'name_ar' => $line['product']->name_ar,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'extra' => $line['extra'],
                    'line_total' => $line['line_total'],
                ]);
            }

            return $order->load('items');
        });
    }

    public function complain(string $slug, string $productName, string $description): MenuComplaint
    {
        $restaurant = $this->openRestaurant($slug);

        return MenuComplaint::query()->create([
            'restaurant_id' => $restaurant->id,
            'product_name' => trim($productName),
            'description' => trim($description),
        ]);
    }

    public function confirm(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== OrderStatus::Pending) {
                throw ApiException::invalid('يمكن تأكيد الطلبات بانتظار التأكيد فقط');
            }

            $locked->load('items');
            $wanted = [];
            foreach ($locked->items as $item) {
                if (! $item->product_id) {
                    throw ApiException::invalid("المنتج {$item->name_ar} لم يعد موجوداً");
                }
                $wanted[$item->product_id] = ($wanted[$item->product_id] ?? 0) + $item->quantity;
            }

            $products = [];
            foreach ($wanted as $productId => $quantity) {
                $product = Product::query()->whereKey($productId)->lockForUpdate()->first();
                if (! $product || $product->restaurantId() !== $locked->restaurant_id) {
                    $name = $locked->items->firstWhere('product_id', $productId)?->name_ar ?? 'منتج';
                    throw ApiException::invalid("المنتج {$name} لم يعد موجوداً");
                }
                if ($product->stock_quantity !== null && $product->stock_quantity < $quantity) {
                    throw ApiException::invalid(
                        "الكمية المتبقية من {$product->name_ar} هي {$product->stock_quantity} ولا تكفي لتأكيد الطلب"
                    );
                }
                $products[] = [$product, $quantity];
            }

            foreach ($products as [$product, $quantity]) {
                if ($product->stock_quantity === null) {
                    continue;
                }
                $product->stock_quantity -= $quantity;
                $product->save();
            }

            $locked->forceFill([
                'status' => OrderStatus::Confirmed,
                'confirmed_at' => now(),
            ])->save();

            return $locked->load('items');
        });
    }

    public function reject(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== OrderStatus::Pending) {
                throw ApiException::invalid('يمكن رفض الطلبات بانتظار التأكيد فقط');
            }

            $locked->forceFill(['status' => OrderStatus::Rejected])->save();

            return $locked->load('items');
        });
    }

    private function openRestaurant(string $slug): Restaurant
    {
        $slug = strtolower(trim($slug));
        $restaurant = $slug === '' ? null : Restaurant::query()->where('slug', $slug)->first();
        if (! $restaurant) {
            throw ApiException::notFound('النشاط غير متاح');
        }

        if (app(YearlyMenuSubscription::class)->closeIfDue($restaurant)) {
            $restaurant->refresh();
        }

        if (! $restaurant->status->isOperational()) {
            throw ApiException::invalid('المنيو غير متاح للطلب');
        }

        return $restaurant;
    }

    private function liveMenu(Restaurant $restaurant): Menu
    {
        $menus = Menu::query()->where('restaurant_id', $restaurant->id)->orderByDesc('published_at')->get();
        $menu = $menus->first(fn (Menu $item) => $item->is_default)
            ?? $menus->first(fn (Menu $item) => $item->status === MenuStatus::Published);

        if (! $menu || $menu->status !== MenuStatus::Published) {
            throw ApiException::invalid('المنيو غير متاح للطلب');
        }

        return $menu;
    }

    /**
     * @param  list<array{product_id:string,quantity:int,extra?:float|int|string}>  $items
     * @return list<array{product:Product,quantity:int,unit_price:float,extra:float,line_total:float,currency:string}>
     */
    private function lines(Restaurant $restaurant, Menu $menu, array $items): array
    {
        $lines = [];
        foreach ($items as $item) {
            $product = Product::query()
                ->forRestaurant($restaurant->id)
                ->whereKey($item['product_id'])
                ->whereHas('category', fn ($query) => $query
                    ->where('menu_id', $menu->id)
                    ->where('is_active', true))
                ->first();

            if (! $product || $product->status !== ProductStatus::Available) {
                throw ApiException::invalid('أحد المنتجات لم يعد متوفراً');
            }

            $quantity = (int) $item['quantity'];
            if ($product->stock_quantity !== null && $product->stock_quantity < $quantity) {
                $left = (int) $product->stock_quantity;
                throw ApiException::invalid("الكمية المتبقية من {$product->name_ar} هي {$left}");
            }

            $extra = round((float) ($item['extra'] ?? 0), 2);
            $unit = round((float) $product->price, 2);
            $lines[] = [
                'product' => $product,
                'quantity' => $quantity,
                'unit_price' => $unit,
                'extra' => $extra,
                'line_total' => round(($unit + $extra) * $quantity, 2),
                'currency' => $product->currency,
            ];
        }

        return $lines;
    }

    private function nextNumber(string $restaurantId): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $number = 'MH-'.strtoupper(Str::random(6));
            $taken = Order::query()->where('restaurant_id', $restaurantId)->where('number', $number)->exists();
            if (! $taken) {
                return $number;
            }
        }

        return 'MH-'.strtoupper(Str::random(8));
    }
}
