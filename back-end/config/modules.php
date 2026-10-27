<?php

/*
|--------------------------------------------------------------------------
| MenuHub modules
|--------------------------------------------------------------------------
|
| Every entry maps to modules/{Name}/Providers/{Name}ServiceProvider.php.
| The order matters only for boot order; modules must not depend on one
| another's internals, only on the contracts/enums living in `Shared`
| or on the public models of the module they extend.
|
| Remove a name to switch the module (routes, migrations, listeners) off.
|
*/

return [
    'enabled' => [
        'Shared',
        'Users',
        'Auth',
        'Tenancy',
        'Audit',
        'Notifications',
        'Catalog',
        'Theming',
        'Operations',
        'Media',
        'Billing',
        'Finance',
        'Analytics',
        'Storefront',
        'Chatbot',
        'Platform',
    ],
];
