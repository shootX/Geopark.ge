<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| მთავარი გვერდი: ვებ-ვერსია (რუკა + სია). სხვა FRONTEND_URL-ზე რედირექტი ირთვება მხოლოდ იმ შემთხვევაში,
| როცა ის განსხვავდება APP_URL-ისგან.
|
*/

Route::get('/', function () {
    $frontend = rtrim((string) config('app.frontend_url'), '/');
    $appUrl = rtrim((string) config('app.url'), '/');

    if ($frontend !== '' && strcasecmp($frontend, $appUrl) !== 0) {
        return redirect()->away($frontend);
    }

    return view('home');
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'Geopark API',
        'version' => 'v1',
    ]);
});
