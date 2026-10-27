<?php

namespace Modules\Operations\Services;

use Modules\Operations\Models\CustomDomain;
use Modules\Shared\Enums\DomainStatus;

/**
 * Proves control of a domain through a DNS TXT record:
 *   _menuhub.{domain}  TXT  menuhub-verify={token}
 *
 * The resolver can be swapped in tests (see `useResolver`).
 */
class DomainVerifier
{
    /** @var (callable(string): list<string>)|null */
    private static $resolver = null;

    /** @param  (callable(string): list<string>)|null  $resolver */
    public static function useResolver(?callable $resolver): void
    {
        self::$resolver = $resolver;
    }

    public function verify(CustomDomain $domain): CustomDomain
    {
        $domain->status = DomainStatus::Verifying;
        $domain->save();

        $records = $this->txtRecords($domain->txtHost());

        if (in_array($domain->txtValue(), $records, true)) {
            $domain->status = DomainStatus::Active;
            $domain->verified_at = now();
            $domain->ssl_status = 'PENDING';
        } else {
            $domain->status = DomainStatus::Failed;
        }

        $domain->save();

        return $domain->refresh();
    }

    /** @return list<string> */
    private function txtRecords(string $host): array
    {
        if (self::$resolver) {
            return (self::$resolver)($host);
        }

        $records = @dns_get_record($host, DNS_TXT) ?: [];

        return array_values(array_filter(array_map(
            fn (array $record) => isset($record['txt']) ? trim($record['txt']) : null,
            $records
        )));
    }
}
