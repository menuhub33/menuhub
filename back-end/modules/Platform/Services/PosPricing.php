<?php

namespace Modules\Platform\Services;

use Modules\Platform\Models\PlatformSetting;
use Modules\Shared\Contracts\PricesPosPackage;
use Modules\Shared\Enums\PosMode;

/**
 * Yearly price of each optional POS package, stored as platform settings.
 * Both prices share one currency, which must match the plan currency of the contract they are added to.
 */
class PosPricing implements PricesPosPackage
{
    private const KEYS = [
        'cashier' => 'pos_price_cashier',
        'cashier_waiter' => 'pos_price_cashier_waiter',
    ];

    private const CURRENCY_KEY = 'pos_price_currency';

    public function priceFor(PosMode $mode): array
    {
        $all = $this->all();

        $amount = match ($mode) {
            PosMode::Cashier => $all['cashier'],
            PosMode::CashierWaiter => $all['cashier_waiter'],
            PosMode::Off => 0.0,
        };

        return ['amount' => $amount, 'currency' => $all['currency']];
    }

    /** @return array{cashier: float, cashier_waiter: float, currency: string} */
    public function all(): array
    {
        $values = PlatformSetting::query()
            ->whereIn('key', [...array_values(self::KEYS), self::CURRENCY_KEY])
            ->pluck('value', 'key');

        return [
            'cashier' => round((float) ($values[self::KEYS['cashier']] ?? 0), 2),
            'cashier_waiter' => round((float) ($values[self::KEYS['cashier_waiter']] ?? 0), 2),
            'currency' => strtoupper((string) ($values[self::CURRENCY_KEY] ?? 'USD')),
        ];
    }

    /**
     * @param  array{cashier: float|int|string, cashier_waiter: float|int|string, currency: string}  $data
     * @return array{cashier: float, cashier_waiter: float, currency: string}
     */
    public function update(array $data): array
    {
        $rows = [
            self::KEYS['cashier'] => round((float) $data['cashier'], 2),
            self::KEYS['cashier_waiter'] => round((float) $data['cashier_waiter'], 2),
            self::CURRENCY_KEY => strtoupper($data['currency']),
        ];

        foreach ($rows as $key => $value) {
            PlatformSetting::query()->updateOrCreate(['key' => $key], ['value' => $value, 'updated_at' => now()]);
        }

        return $this->all();
    }
}
