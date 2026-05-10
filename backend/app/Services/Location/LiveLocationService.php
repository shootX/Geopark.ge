<?php

namespace App\Services\Location;

use App\Events\RenterArrived;
use App\Events\UsersLocationUpdated;
use App\Models\Booking;
use App\Models\LiveLocation;
use App\Models\User;
use Illuminate\Support\Collection;

class LiveLocationService
{
    /**
     * Geofence radius in meters.
     */
    const GEOFENCE_RADIUS_METERS = 100;

    /**
     * Update user's location for a booking.
     */
    public function updateLocation(Booking $booking, User $user, float $latitude, float $longitude, ?float $heading = null, ?float $speed = null): LiveLocation
    {
        $location = LiveLocation::updateLocation(
            $booking->id,
            $user->id,
            $latitude,
            $longitude,
            $heading,
            $speed
        );

        // Broadcast the location update
        event(new UsersLocationUpdated($booking, $user, $latitude, $longitude, $heading, $speed));

        // Check geofence arrival if this is the renter
        if ($user->id === $booking->user_id) {
            $this->checkArrivalGeofence($booking, $latitude, $longitude);
        }

        return $location;
    }

    /**
     * Get live locations for both parties in a booking.
     */
    public function getBookingLocations(Booking $booking): Collection
    {
        return LiveLocation::forBooking($booking->id)
            ->recent(5) // Only locations updated in last 5 minutes
            ->get();
    }

    /**
     * Get the parking offer's location coordinates.
     */
    public function getParkingLocation(Booking $booking): ?array
    {
        if ($booking->parkingOffer) {
            return [
                'latitude' => $booking->parkingOffer->latitude,
                'longitude' => $booking->parkingOffer->longitude,
                'address' => $booking->parkingOffer->address,
            ];
        }

        if ($booking->parking) {
            return [
                'latitude' => $booking->parking->latitude,
                'longitude' => $booking->parking->longitude,
                'address' => $booking->parking->address,
            ];
        }

        return null;
    }

    /**
     * Check if renter has arrived within geofence.
     */
    private function checkArrivalGeofence(Booking $booking, float $renterLat, float $renterLng): void
    {
        $parkingLocation = $this->getParkingLocation($booking);
        if (!$parkingLocation) {
            return;
        }

        $withinGeofence = LiveLocation::isWithinGeofence(
            $renterLat,
            $renterLng,
            $parkingLocation['latitude'],
            $parkingLocation['longitude'],
            self::GEOFENCE_RADIUS_METERS
        );

        if ($withinGeofence && $booking->booking_status->value === 'renter_on_the_way') {
            $booking->markArrived();
            event(new RenterArrived($booking, 'geofence'));
        }
    }

    /**
     * Manually confirm arrival by renter.
     */
    public function confirmArrival(Booking $booking, User $user): Booking
    {
        if ($user->id !== $booking->user_id) {
            abort(403, 'Only the renter can confirm arrival.');
        }

        $booking->markArrived();
        event(new RenterArrived($booking, 'manual'));

        return $booking->fresh();
    }

    /**
     * Owner confirms renter's arrival.
     */
    public function ownerConfirmArrival(Booking $booking, User $user): Booking
    {
        $owner = $booking->getOwner();
        if (!$owner || $user->id !== $owner->id) {
            abort(403, 'Only the owner can confirm arrival.');
        }

        $booking->markArrived();
        event(new RenterArrived($booking, 'owner_confirmed'));

        return $booking->fresh();
    }

    /**
     * Calculate estimated time of arrival (in minutes) between renter and parking.
     */
    public function calculateEta(Booking $booking): ?float
    {
        $renterLocation = LiveLocation::forBooking($booking->id)
            ->forUser($booking->user_id)
            ->recent(1)
            ->first();

        $parkingLocation = $this->getParkingLocation($booking);

        if (!$renterLocation || !$parkingLocation) {
            return null;
        }

        $distanceKm = LiveLocation::calculateDistance(
            $renterLocation->latitude,
            $renterLocation->longitude,
            $parkingLocation['latitude'],
            $parkingLocation['longitude']
        );

        // Assuming average speed of 30 km/h for city driving
        $averageSpeedKmh = $renterLocation->speed > 0 ? $renterLocation->speed * 3.6 : 30;
        $averageSpeedKmh = max(5, $averageSpeedKmh); // minimum 5 km/h

        $etaMinutes = ($distanceKm / $averageSpeedKmh) * 60;

        return round($etaMinutes, 1);
    }

    /**
     * GPS spoofing protection: validate that the location update is plausible.
     */
    public function validateLocationUpdate(Booking $booking, User $user, float $latitude, float $longitude): bool
    {
        $lastLocation = LiveLocation::forBooking($booking->id)
            ->forUser($user->id)
            ->recent(1)
            ->first();

        if (!$lastLocation) {
            return true; // No previous location, can't validate
        }

        $distanceKm = LiveLocation::calculateDistance(
            $lastLocation->latitude,
            $lastLocation->longitude,
            $latitude,
            $longitude
        );

        $timeDiffMinutes = now()->diffInMinutes($lastLocation->updated_at);

        if ($timeDiffMinutes === 0) {
            return true; // Same timestamp, skip validation
        }

        // Max plausible speed: 200 km/h (teleportation detection)
        $speedKmh = ($distanceKm / $timeDiffMinutes) * 60;

        if ($speedKmh > 200) {
            return false; // Impossible speed - likely GPS spoofing
        }

        return true;
    }

    /**
     * Clean up old location records.
     */
    public function cleanupOldLocations(int $olderThanMinutes = 60): int
    {
        return LiveLocation::where('updated_at', '<', now()->subMinutes($olderThanMinutes))->delete();
    }
}
