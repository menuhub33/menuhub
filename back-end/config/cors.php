<?php

$root = env('ROOT_DOMAIN');

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // The Next.js front-end plus every tenant sub-domain / custom domain host.
    'allowed_origins' => array_values(array_filter(array_merge(
        [rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/')],
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))),
    ))),

    'allowed_origins_patterns' => $root
        ? ['#^https://([a-z0-9-]+\.)?'.preg_quote($root, '#').'$#']
        : [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Retry-After'],

    'max_age' => 600,

    // Bearer tokens only; no cookies cross the origin.
    'supports_credentials' => false,

];
