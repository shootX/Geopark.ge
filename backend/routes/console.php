<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Marketplace: Expire stale bookings every 15 minutes
Schedule::command('bookings:expire-stale')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();
