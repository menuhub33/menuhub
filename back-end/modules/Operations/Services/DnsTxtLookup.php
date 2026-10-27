<?php

namespace Modules\Operations\Services;

/**
 * Thin wrapper around the DNS function so tests can swap it out.
 */
class DnsTxtLookup
{
    /** @return list<string> */
    public function records(string $host): array
    {
        $records = @dns_get_record($host, DNS_TXT) ?: [];

        return array_values(array_filter(array_map(fn (array $record) => $record['txt'] ?? null, $records)));
    }
}
