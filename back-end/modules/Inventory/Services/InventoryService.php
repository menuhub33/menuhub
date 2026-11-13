<?php

namespace Modules\Inventory\Services;

use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Product;
use Modules\Inventory\Models\StockMovement;
use Modules\Orders\Models\Order;
use Modules\Shared\Enums\StockMovementReason;
use Modules\Shared\Exceptions\ApiException;

/**
 * The one place that moves product stock for sales documents.
 *
 * Both operations are idempotent per order (guards on the order row plus a
 * unique index on `stock_movements`) and lock products in a fixed order so
 * concurrent sales can never deadlock. Products with `stock_quantity = NULL`
 * are not tracked and never produce a movement.
 *
 * The caller owns the surrounding transaction; the methods open a nested one
 * so they are also safe to call on their own.
 */
class InventoryService
{
    /** Takes the order's quantities out of stock (once). */
    public function deduct(Order $order, ?string $userId = null): void
    {
        DB::transaction(function () use ($order, $userId) {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->inventory_deducted_at !== null) {
                $order->forceFill(['inventory_deducted_at' => $locked->inventory_deducted_at])
                    ->syncOriginalAttribute('inventory_deducted_at');

                return;
            }

            $products = $this->lockProducts($locked);

            foreach ($products as $productId => [$product, $quantity]) {
                if (! $product || $product->restaurantId() !== $locked->restaurant_id) {
                    throw ApiException::invalid('أحد المنتجات لم يعد موجوداً', 'PRODUCT_NOT_SELLABLE');
                }
                if ($product->stock_quantity !== null && $product->stock_quantity < $quantity) {
                    throw new ApiException(
                        "الكمية المتبقية من {$product->name_ar} هي {$product->stock_quantity} ولا تكفي",
                        422,
                        'INSUFFICIENT_STOCK',
                        ['product_id' => $productId, 'available' => (int) $product->stock_quantity],
                    );
                }
            }

            foreach ($products as $productId => [$product, $quantity]) {
                $this->move($locked, $product, -$quantity, StockMovementReason::Sale, $userId);
            }

            $now = now();
            $locked->forceFill(['inventory_deducted_at' => $now])->save();
            $order->forceFill(['inventory_deducted_at' => $now])->syncOriginalAttribute('inventory_deducted_at');
        });
    }

    /** Puts a previously deducted order back into stock (once). */
    public function restore(Order $order, ?string $userId = null): void
    {
        DB::transaction(function () use ($order, $userId) {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->inventory_deducted_at === null || $locked->inventory_restored_at !== null) {
                return;
            }

            foreach ($this->lockProducts($locked) as [$product, $quantity]) {
                if ($product) {
                    $this->move($locked, $product, $quantity, StockMovementReason::CancelReturn, $userId);
                }
            }

            $now = now();
            $locked->forceFill(['inventory_restored_at' => $now])->save();
            $order->forceFill(['inventory_restored_at' => $now])->syncOriginalAttribute('inventory_restored_at');
        });
    }

    /**
     * Locks the order's products in ascending id order.
     *
     * @return array<string, array{0: ?Product, 1: int}> product id => [product, quantity]
     */
    private function lockProducts(Order $order): array
    {
        $wanted = [];
        foreach ($order->items()->get() as $item) {
            if (! $item->product_id) {
                continue;
            }
            $wanted[$item->product_id] = ($wanted[$item->product_id] ?? 0) + $item->quantity;
        }
        ksort($wanted);

        $locked = [];
        foreach ($wanted as $productId => $quantity) {
            $locked[$productId] = [Product::query()->whereKey($productId)->lockForUpdate()->first(), $quantity];
        }

        return $locked;
    }

    private function move(Order $order, Product $product, int $delta, StockMovementReason $reason, ?string $userId): void
    {
        if ($product->stock_quantity === null) {
            return;
        }

        $before = (int) $product->stock_quantity;
        $after = $before + $delta;

        $product->stock_quantity = $after;
        $product->save();

        StockMovement::query()->create([
            'restaurant_id' => $order->restaurant_id,
            'product_id' => $product->id,
            'product_name' => $product->name_ar,
            'order_id' => $order->id,
            'reason' => $reason,
            'quantity_delta' => $delta,
            'stock_before' => $before,
            'stock_after' => $after,
            'created_by' => $userId,
        ]);
    }
}
