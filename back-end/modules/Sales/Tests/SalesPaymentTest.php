<?php

namespace Modules\Sales\Tests;

use LogicException;
use Modules\Orders\Models\Order;
use Modules\Sales\Models\OrderPayment;
use Modules\Shared\Enums\RestaurantRole;

class SalesPaymentTest extends SalesTestCase
{
    private function paidSale(string $method = 'CASH'): string
    {
        return $this->sell($this->payload(['payment' => ['method' => $method]]))->assertCreated()->json('data.id');
    }

    private function unpaidSale(): string
    {
        return $this->sell($this->payload(['channel' => 'EXTERNAL']))->assertCreated()->json('data.id');
    }

    public function test_collecting_twice_with_the_same_key_records_one_payment(): void
    {
        $this->as($this->owner);
        $id = $this->unpaidSale();
        $key = $this->key();
        $body = ['method' => 'CASH', 'amount' => 8000];

        $first = $this->postJson($this->url("orders/{$id}/payments"), $body, ['Idempotency-Key' => $key])->assertCreated();
        $replay = $this->postJson($this->url("orders/{$id}/payments"), $body, ['Idempotency-Key' => $key])
            ->assertOk()->assertHeader('Idempotent-Replay', 'true');

        $this->assertSame(8000, $first->json('data.paid_amount'));
        $this->assertSame(8000, $replay->json('data.paid_amount'));
        $this->assertSame(1, OrderPayment::query()->count());

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CASH', 'amount' => 9000], ['Idempotency-Key' => $key])
            ->assertStatus(409)->assertJsonPath('code', 'IDEMPOTENCY_KEY_REUSED');
    }

    public function test_cash_tendered_must_cover_the_amount(): void
    {
        $this->as($this->owner);
        $id = $this->unpaidSale();

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CASH', 'amount' => 20000, 'tendered_amount' => 10000], ['Idempotency-Key' => $this->key()])
            ->assertStatus(422);
        $this->assertSame(0, OrderPayment::query()->count());
    }

    public function test_a_paid_invoice_cannot_be_paid_again(): void
    {
        $this->as($this->owner);
        $id = $this->paidSale();

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CASH', 'amount' => 1], ['Idempotency-Key' => $this->key()])
            ->assertStatus(422)->assertJsonPath('code', 'OVERPAYMENT');
    }

    public function test_refund_cannot_exceed_what_was_collected_and_never_reopens_the_balance(): void
    {
        $this->as($this->owner);
        $id = $this->paidSale('CARD');

        $this->postJson($this->url("orders/{$id}/refunds"), ['method' => 'CARD', 'amount' => 20001, 'reason' => 'خطأ'], ['Idempotency-Key' => $this->key()])
            ->assertStatus(422)->assertJsonPath('code', 'REFUND_EXCEEDS_PAID');

        $this->postJson($this->url("orders/{$id}/refunds"), ['method' => 'CARD', 'amount' => 5000, 'reason' => 'منتج تالف'], ['Idempotency-Key' => $this->key()])
            ->assertCreated()
            ->assertJsonPath('data.payment_status', 'PAID')
            ->assertJsonPath('data.refunded_amount', 5000)
            ->assertJsonPath('data.balance_due', 0);

        $this->postJson($this->url("orders/{$id}/refunds"), ['method' => 'CARD', 'amount' => 15000, 'reason' => 'الباقي'], ['Idempotency-Key' => $this->key()])
            ->assertCreated()->assertJsonPath('data.payment_status', 'REFUNDED');

        $this->postJson($this->url("orders/{$id}/refunds"), ['method' => 'CARD', 'amount' => 1, 'reason' => 'زيادة'], ['Idempotency-Key' => $this->key()])
            ->assertStatus(422)->assertJsonPath('code', 'REFUND_EXCEEDS_PAID');
    }

    public function test_the_money_ledger_is_immutable(): void
    {
        $this->as($this->owner);
        $this->paidSale();
        $payment = OrderPayment::query()->firstOrFail();

        try {
            $payment->update(['amount' => 1]);
            $this->fail('A payment was updated');
        } catch (LogicException) {
            $this->assertTrue(true);
        }

        try {
            $payment->delete();
            $this->fail('A payment was deleted');
        } catch (LogicException) {
            $this->assertTrue(true);
        }

        $this->assertSame('20000.00', $payment->refresh()->amount);
    }

    public function test_cached_money_columns_always_match_the_ledger(): void
    {
        $this->as($this->owner);
        $id = $this->unpaidSale();

        foreach ([['CASH', 7000], ['CARD', 3000]] as [$method, $amount]) {
            $this->postJson($this->url("orders/{$id}/payments"), ['method' => $method, 'amount' => $amount], ['Idempotency-Key' => $this->key()])->assertCreated();
        }
        $this->postJson($this->url("orders/{$id}/refunds"), ['method' => 'CASH', 'amount' => 2000, 'reason' => 'استرداد جزئي'], ['Idempotency-Key' => $this->key()])->assertCreated();

        $order = Order::query()->findOrFail($id);
        $this->assertSame('10000.00', $order->paid_amount);
        $this->assertSame('2000.00', $order->refunded_amount);
        $this->assertSame('PARTIAL', $order->payment_status->value);
    }

    public function test_only_confirmed_invoices_can_be_collected(): void
    {
        $this->as($this->owner);
        $id = $this->unpaidSale();
        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'ألغاه الزبون'])->assertOk();

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CASH'], ['Idempotency-Key' => $this->key()])
            ->assertStatus(422)->assertJsonPath('code', 'ORDER_NOT_COLLECTABLE');
    }

    public function test_cancelling_an_unpaid_invoice_returns_the_stock_exactly_once(): void
    {
        $this->as($this->staff(RestaurantRole::Manager));
        $id = $this->unpaidSale();
        $this->assertSame(8, $this->product->refresh()->stock_quantity);

        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'ألغاه الزبون'])
            ->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED')
            ->assertJsonPath('data.cancel_reason', 'ألغاه الزبون');
        $this->assertSame(10, $this->product->refresh()->stock_quantity);

        // Repeating the request must not put the stock back a second time.
        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'ألغاه الزبون'])->assertOk();
        $this->assertSame(10, $this->product->refresh()->stock_quantity);
        $this->assertDatabaseCount('stock_movements', 2);

        // The invoice is never deleted.
        $this->assertNotNull(Order::query()->find($id));
    }

    public function test_cancelling_a_paid_invoice_requires_the_refund(): void
    {
        $this->as($this->owner);
        $id = $this->paidSale();

        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'خطأ في الطلب'])
            ->assertStatus(422)->assertJsonPath('code', 'REFUND_REQUIRED_BEFORE_CANCEL');
        $this->assertSame('CONFIRMED', Order::query()->findOrFail($id)->status->value);
        $this->assertSame(8, $this->product->refresh()->stock_quantity);

        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'خطأ في الطلب', 'refund_method' => 'CASH'])
            ->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED')
            ->assertJsonPath('data.payment_status', 'REFUNDED')
            ->assertJsonPath('data.refunded_amount', 20000);

        $this->assertSame(10, $this->product->refresh()->stock_quantity);
    }

    public function test_cancel_needs_a_reason(): void
    {
        $this->as($this->owner);
        $id = $this->unpaidSale();

        $this->postJson($this->url("orders/{$id}/cancel"), [])->assertStatus(422)->assertJsonValidationErrors('reason');
    }

    public function test_a_confirmed_qr_order_enters_the_ledger_and_can_be_collected(): void
    {
        $qr = $this->postJson($this->api("public/menus/{$this->restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');

        $this->as($this->owner);

        $this->postJson($this->api("restaurants/{$this->restaurant->id}/orders/{$qr}/confirm"))->assertOk();

        // It is listed in the unified ledger as a QR order (and as open before it was confirmed).
        $this->getJson($this->url('orders?channel=QR'))->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.channel', 'QR')
            ->assertJsonPath('data.0.fulfillment_status', 'CONFIRMED');

        $this->postJson($this->url("orders/{$qr}/payments"), ['method' => 'CASH'], ['Idempotency-Key' => $this->key()])
            ->assertCreated()->assertJsonPath('data.payment_status', 'PAID');

        // Confirmed through the legacy path (no stock marker yet): cancelling is not supported yet.
        $this->postJson($this->url("orders/{$qr}/cancel"), ['reason' => 'اختبار', 'refund_method' => 'CASH'])
            ->assertStatus(422)->assertJsonPath('code', 'CANCEL_NOT_SUPPORTED_YET');
    }
}
