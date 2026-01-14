<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$u = App\Models\User::where('email','luis@dixer.net')->first();
if ($u) { echo "USER_EXISTS:" . $u->email . PHP_EOL; exit; }
$new = App\Models\User::create(['name'=>'Luis','email'=>'luis@dixer.net','password'=>'#Mexico1986','role'=>'admin']);
if ($new) { echo "CREATED:" . json_encode($new) . PHP_EOL; } else { echo "CREATE_FAIL\n"; }
