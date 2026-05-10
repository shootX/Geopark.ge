<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
| All routes are versioned under /api/v1
|
*/

Route::prefix('v1')->group(function () {

    Route::get('/', function () {
        return response()->json([
            'success' => true,
            'message' => 'API v1 is running'
        ]);
    });

    // ─── Public Routes (No Auth) ───
    Route::post('auth/register', [\App\Http\Controllers\API\Auth\AuthController::class, 'register']);
    Route::post('auth/login', [\App\Http\Controllers\API\Auth\AuthController::class, 'login']);
    Route::post('auth/forgot-password', [\App\Http\Controllers\API\Auth\AuthController::class, 'forgotPassword']);
    Route::post('auth/reset-password', [\App\Http\Controllers\API\Auth\AuthController::class, 'resetPassword']);
    Route::get('auth/verify-email/{id}/{hash}', [\App\Http\Controllers\API\Auth\AuthController::class, 'verifyEmail'])->name('verification.verify');

    // Public parking listings
    Route::get('parkings', [\App\Http\Controllers\API\ParkingController::class, 'index']);
    Route::get('parkings/nearby', [\App\Http\Controllers\API\ParkingController::class, 'nearby']);
    Route::get('parkings/{parking}', [\App\Http\Controllers\API\ParkingController::class, 'show']);

    // Pricing (public calculation)
    Route::post('pricing/calculate', [\App\Http\Controllers\API\PricingController::class, 'calculatePrice']);
    Route::post('pricing/calculate-dynamic', [\App\Http\Controllers\API\PricingController::class, 'calculateDynamic']);
    Route::post('pricing/validate-formula', [\App\Http\Controllers\API\PricingController::class, 'validateFormula']);

    // ─── Authenticated Routes ───
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('auth/logout', [\App\Http\Controllers\API\Auth\AuthController::class, 'logout']);
        Route::post('auth/logout-all', [\App\Http\Controllers\API\Auth\AuthController::class, 'logoutAllDevices']);
        Route::get('auth/me', [\App\Http\Controllers\API\Auth\AuthController::class, 'me']);
        Route::put('auth/profile', [\App\Http\Controllers\API\Auth\AuthController::class, 'updateProfile']);
        Route::post('auth/email/resend', [\App\Http\Controllers\API\Auth\AuthController::class, 'resendEmailVerification']);
        Route::post('auth/phone/send', [\App\Http\Controllers\API\Auth\AuthController::class, 'sendPhoneVerification']);
        Route::post('auth/phone/verify', [\App\Http\Controllers\API\Auth\AuthController::class, 'verifyPhone']);

        // Parking Management (Owner)
        Route::post('parkings', [\App\Http\Controllers\API\ParkingController::class, 'store']);
        Route::put('parkings/{parking}', [\App\Http\Controllers\API\ParkingController::class, 'update']);
        Route::delete('parkings/{parking}', [\App\Http\Controllers\API\ParkingController::class, 'destroy']);
        Route::get('my-parkings', [\App\Http\Controllers\API\ParkingController::class, 'myParkings']);
        Route::patch('parkings/{parking}/status', [\App\Http\Controllers\API\ParkingController::class, 'toggleStatus']);

        // Bookings
        Route::get('bookings', [\App\Http\Controllers\API\BookingController::class, 'index']);
        Route::post('bookings', [\App\Http\Controllers\API\BookingController::class, 'store']);
        Route::get('bookings/{booking}', [\App\Http\Controllers\API\BookingController::class, 'show']);
        Route::post('bookings/{booking}/cancel', [\App\Http\Controllers\API\BookingController::class, 'cancel']);
        Route::post('bookings/{booking}/approve', [\App\Http\Controllers\API\BookingController::class, 'approve']);
        Route::post('bookings/{booking}/reject', [\App\Http\Controllers\API\BookingController::class, 'reject']);
        Route::post('bookings/{booking}/start-trip', [\App\Http\Controllers\API\BookingController::class, 'startTrip']);
        Route::post('bookings/{booking}/confirm-arrival', [\App\Http\Controllers\API\BookingController::class, 'confirmArrival']);
        Route::post('bookings/{booking}/complete', [\App\Http\Controllers\API\BookingController::class, 'completeLifecycle']);
        Route::get('my-bookings', [\App\Http\Controllers\API\BookingController::class, 'myBookings']);
        Route::get('my-bookings/active', [\App\Http\Controllers\API\BookingController::class, 'activeBooking']);
        Route::get('my-bookings/history', [\App\Http\Controllers\API\BookingController::class, 'history']);
        Route::get('my-bookings/pending-approval', [\App\Http\Controllers\API\BookingController::class, 'pendingApproval']);

        // Offers
        Route::get('offers', [\App\Http\Controllers\API\OfferController::class, 'index']);
        Route::post('offers', [\App\Http\Controllers\API\OfferController::class, 'store']);
        Route::get('offers/{offer}', [\App\Http\Controllers\API\OfferController::class, 'show']);
        Route::post('offers/{offer}/accept', [\App\Http\Controllers\API\OfferController::class, 'accept']);
        Route::post('offers/{offer}/reject', [\App\Http\Controllers\API\OfferController::class, 'reject']);
        Route::get('my-offers', [\App\Http\Controllers\API\OfferController::class, 'myOffers']);
        Route::get('my-offers/pending', [\App\Http\Controllers\API\OfferController::class, 'pendingOffers']);

        // Pricing Rules
        Route::get('pricing-rules', [\App\Http\Controllers\API\PricingController::class, 'index']);
        Route::get('pricing-rules/{pricingRule}', [\App\Http\Controllers\API\PricingController::class, 'show']);
        Route::post('pricing-rules', [\App\Http\Controllers\API\PricingController::class, 'store']);
        Route::put('pricing-rules/{pricingRule}', [\App\Http\Controllers\API\PricingController::class, 'update']);
        Route::delete('pricing-rules/{pricingRule}', [\App\Http\Controllers\API\PricingController::class, 'destroy']);
        Route::get('parkings/{parking}/pricing-logs', [\App\Http\Controllers\API\PricingController::class, 'logs']);

        // User Cars
        Route::apiResource('user-cars', \App\Http\Controllers\API\UserCarController::class);
        Route::post('user-cars/{user_car}/set-default', [\App\Http\Controllers\API\UserCarController::class, 'setDefault']);

        // Notifications
        Route::get('notifications', [\App\Http\Controllers\API\User\NotificationController::class, 'index']);
        Route::get('notifications/unread', [\App\Http\Controllers\API\User\NotificationController::class, 'unread']);
        Route::post('notifications/{id}/read', [\App\Http\Controllers\API\User\NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [\App\Http\Controllers\API\User\NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [\App\Http\Controllers\API\User\NotificationController::class, 'destroy']);
        Route::delete('notifications', [\App\Http\Controllers\API\User\NotificationController::class, 'clearAll']);
        Route::get('notifications/count', [\App\Http\Controllers\API\User\NotificationController::class, 'count']);

        // ─── Parking Offers (Marketplace) ───
        Route::get('parking-offers', [\App\Http\Controllers\API\ParkingOfferController::class, 'index']);
        Route::get('parking-offers/{parkingOffer}', [\App\Http\Controllers\API\ParkingOfferController::class, 'show']);
        Route::post('parking-offers', [\App\Http\Controllers\API\ParkingOfferController::class, 'store']);
        Route::put('parking-offers/{parkingOffer}', [\App\Http\Controllers\API\ParkingOfferController::class, 'update']);
        Route::delete('parking-offers/{parkingOffer}', [\App\Http\Controllers\API\ParkingOfferController::class, 'destroy']);
        Route::get('my-parking-offers', [\App\Http\Controllers\API\ParkingOfferController::class, 'myOffers']);
        Route::post('parking-offers/{parkingOffer}/activate', [\App\Http\Controllers\API\ParkingOfferController::class, 'activate']);
        Route::post('parking-offers/{parkingOffer}/pause', [\App\Http\Controllers\API\ParkingOfferController::class, 'pause']);
        Route::post('parking-offers/{parkingOffer}/images', [\App\Http\Controllers\API\ParkingOfferController::class, 'addImages']);
        Route::delete('parking-offers/{parkingOffer}/images/{imageId}', [\App\Http\Controllers\API\ParkingOfferController::class, 'removeImage']);

        // ─── Wallet ───
        Route::get('wallet', [\App\Http\Controllers\API\WalletController::class, 'show']);
        Route::get('wallet/balance', [\App\Http\Controllers\API\WalletController::class, 'balance']);
        Route::post('wallet/deposit', [\App\Http\Controllers\API\WalletController::class, 'deposit']);
        Route::post('wallet/withdraw', [\App\Http\Controllers\API\WalletController::class, 'withdraw']);
        Route::get('wallet/transactions', [\App\Http\Controllers\API\WalletController::class, 'transactions']);

        // ─── Ratings ───
        Route::post('bookings/{booking}/ratings', [\App\Http\Controllers\API\RatingController::class, 'store']);
        Route::get('ratings/received', [\App\Http\Controllers\API\RatingController::class, 'received']);
        Route::get('ratings/given', [\App\Http\Controllers\API\RatingController::class, 'given']);
        Route::get('bookings/{booking}/ratings', [\App\Http\Controllers\API\RatingController::class, 'booking']);

        // ─── Live Locations ───
        Route::post('bookings/{booking}/location', [\App\Http\Controllers\API\LiveLocationController::class, 'update']);
        Route::get('bookings/{booking}/location', [\App\Http\Controllers\API\LiveLocationController::class, 'show']);
        Route::post('bookings/{booking}/confirm-arrival', [\App\Http\Controllers\API\LiveLocationController::class, 'confirmArrival']);
        Route::post('bookings/{booking}/owner-confirm-arrival', [\App\Http\Controllers\API\LiveLocationController::class, 'ownerConfirmArrival']);
        Route::get('bookings/{booking}/eta', [\App\Http\Controllers\API\LiveLocationController::class, 'eta']);

        // ─── Admin Routes ───
        Route::middleware(['role:admin'])->prefix('admin')->group(function () {

            // Dashboard
            Route::get('dashboard', [\App\Http\Controllers\API\Admin\DashboardController::class, 'index']);
            Route::get('dashboard/reports', [\App\Http\Controllers\API\Admin\DashboardController::class, 'reports']);

            // Users Management
            Route::get('users', [\App\Http\Controllers\API\Admin\DashboardController::class, 'users']);
            Route::get('users/{id}', [\App\Http\Controllers\API\Admin\DashboardController::class, 'showUser']);
            Route::put('users/{id}', [\App\Http\Controllers\API\Admin\DashboardController::class, 'updateUser']);
            Route::delete('users/{id}', [\App\Http\Controllers\API\Admin\DashboardController::class, 'deleteUser']);

            // Parkings Management
            Route::get('parkings', [\App\Http\Controllers\API\Admin\DashboardController::class, 'parkings']);

            // Bookings Management
            Route::get('bookings', [\App\Http\Controllers\API\Admin\DashboardController::class, 'bookings']);

            // User Cars Management
            Route::get('user-cars', [\App\Http\Controllers\API\Admin\UserCarController::class, 'index']);
            Route::get('user-cars/{id}', [\App\Http\Controllers\API\Admin\UserCarController::class, 'show']);
            Route::delete('user-cars/{id}', [\App\Http\Controllers\API\Admin\UserCarController::class, 'destroy']);
            Route::post('user-cars/{id}/flag', [\App\Http\Controllers\API\Admin\UserCarController::class, 'flag']);

            // Pricing Rules Management
            Route::get('pricing-rules', [\App\Http\Controllers\API\Admin\DashboardController::class, 'pricingRules']);

            // ─── Marketplace Management ───
            Route::prefix('marketplace')->group(function () {

                // Parking Offers
                Route::get('parking-offers', [\App\Http\Controllers\API\Admin\MarketplaceController::class, 'parkingOffers']);
                Route::get('parking-offers/stats', [\App\Http\Controllers\API\Admin\MarketplaceController::class, 'stats']);

                // Wallets
                Route::get('wallets', [\App\Http\Controllers\API\Admin\MarketplaceController::class, 'wallets']);

                // Transactions
                Route::get('transactions', [\App\Http\Controllers\API\Admin\MarketplaceController::class, 'transactions']);

                // Ratings
                Route::get('ratings', [\App\Http\Controllers\API\Admin\MarketplaceController::class, 'ratings']);
            });
        });
    });
});
