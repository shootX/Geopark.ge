<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\Offer;
use App\Models\Parking;
use App\Models\ParkingOffer;
use App\Models\UserCar;
use App\Observers\BookingObserver;
use App\Policies\BookingPolicy;
use App\Policies\OfferPolicy;
use App\Policies\ParkingPolicy;
use App\Policies\ParkingOfferPolicy;
use App\Policies\UserCarPolicy;
use App\Repositories\BookingRepository;
use App\Repositories\OfferRepository;
use App\Repositories\ParkingRepository;
use App\Repositories\PricingRuleRepository;
use App\Repositories\UserRepository;
use App\Services\Auth\AuthService;
use App\Services\Booking\BookingLifecycleService;
use App\Services\Booking\BookingService;
use App\Services\Location\LiveLocationService;
use App\Services\Notification\NotificationService;
use App\Services\Offer\OfferService;
use App\Services\Parking\ParkingService;
use App\Services\ParkingOffer\ParkingOfferService;
use App\Services\Payment\PaymentService;
use App\Services\Payment\PaymentSettlementService;
use App\Services\Payment\WalletService;
use App\Services\Pricing\PricingService;
use App\Services\Rating\RatingService;
use App\Services\UserCar\UserCarService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register Repositories
        $this->app->singleton(UserRepository::class);
        $this->app->singleton(ParkingRepository::class);
        $this->app->singleton(BookingRepository::class);
        $this->app->singleton(OfferRepository::class);
        $this->app->singleton(PricingRuleRepository::class);

        // Register Services
        $this->app->singleton(AuthService::class);
        $this->app->singleton(BookingService::class);
        $this->app->singleton(BookingLifecycleService::class);
        $this->app->singleton(ParkingService::class);
        $this->app->singleton(ParkingOfferService::class);
        $this->app->singleton(PricingService::class);
        $this->app->singleton(OfferService::class);
        $this->app->singleton(NotificationService::class);
        $this->app->singleton(UserCarService::class);
        $this->app->singleton(WalletService::class);
        $this->app->singleton(PaymentService::class);
        $this->app->singleton(PaymentSettlementService::class);
        $this->app->singleton(LiveLocationService::class);
        $this->app->singleton(RatingService::class);
    }

    public function boot(): void
    {
        // Register Observers
        Booking::observe(BookingObserver::class);

        // Register Policies
        \Illuminate\Support\Facades\Gate::policy(Parking::class, ParkingPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(ParkingOffer::class, ParkingOfferPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(Booking::class, BookingPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(Offer::class, OfferPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(UserCar::class, UserCarPolicy::class);
    }
}
