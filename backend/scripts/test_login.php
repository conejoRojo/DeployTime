<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$u = App\Models\User::where('email','luis@dixer.net')->first();
if (! $u) { echo "NO USER\n"; exit; }
echo "db_email:" . $u->email . PHP_EOL;
echo "db_pwd_hash:" . $u->password . PHP_EOL;
echo "hash_check:" . (Illuminate\Support\Facades\Hash::check('#Mexico1986', $u->password) ? 'true' : 'false') . PHP_EOL;
$token = auth()->attempt(['email' => 'luis@dixer.net', 'password' => '#Mexico1986']);
if ($token) {
    echo "TOKEN:" . $token . PHP_EOL;
} else {
    echo "AUTH_ATTEMPT:FAIL" . PHP_EOL;
}
