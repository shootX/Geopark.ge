<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'parking_id',
        'parking_offer_id',
        'user_car_id',
        'start_time',
        'end_time',
        'total_price',
        'booking_status',
        'vehicle_plate',
        'notes',
        'cancelled_at',
        'cancellation_reason',
        'rejection_reason',
        'approved_at',
        'started_at',
        'arrived_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'total_price' => 'float',
            'booking_status' => BookingStatus::class,
            'cancelled_at' => 'datetime',
            'approved_at' => 'datetime',
            'started_at' => 'datetime',
            'arrived_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    // ─── Relationships ───

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parking()
    {
        return $this->belongsTo(Parking::class);
    }

    /**
     * 🆕 The parking offer for marketplace bookings.
     */
    public function parkingOffer()
    {
        return $this->belongsTo(ParkingOffer::class, 'parking_offer_id');
    }

    public function userCar()
    {
        return $this->belongsTo(UserCar::class);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    /**
     * 🆕 The escrow transaction for this booking.
     */
    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    /**
     * 🆕 Ratings for this booking.
     */
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    /**
     * 🆕 Live locations for this booking.
     */
    public function liveLocations()
    {
        return $this->hasMany(LiveLocation::class);
    }

    // ─── Scopes ───

    public function scopeActive($query)
    {
        return $query->whereIn('booking_status', [
            BookingStatus::Pending,
            BookingStatus::PendingOwnerApproval,
            BookingStatus::Approved,
            BookingStatus::RenterOnTheWay,
            BookingStatus::OwnerWaiting,
            BookingStatus::Arrived,
            BookingStatus::Active,
        ]);
    }

    public function scopeByStatus($query, BookingStatus $status)
    {
        return $query->where('booking_status', $status);
    }

    public function scopeOverlapping($query, int $parkingId, $startTime, $endTime)
    {
        return $query->where('parking_id', $parkingId)
            ->whereIn('booking_status', [
                BookingStatus::Pending,
                BookingStatus::PendingOwnerApproval,
                BookingStatus::Approved,
                BookingStatus::RenterOnTheWay,
                BookingStatus::OwnerWaiting,
                BookingStatus::Arrived,
                BookingStatus::Active,
            ])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                  ->where('end_time', '>', $startTime);
            });
    }

    /**
     * 🆕 Overlapping for offer-based bookings.
     */
    public function scopeOverlappingOffer($query, int $parkingOfferId, $startTime, $endTime)
    {
        return $query->where('parking_offer_id', $parkingOfferId)
            ->whereIn('booking_status', [
                BookingStatus::PendingOwnerApproval,
                BookingStatus::Approved,
                BookingStatus::RenterOnTheWay,
                BookingStatus::OwnerWaiting,
                BookingStatus::Arrived,
                BookingStatus::Active,
            ])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                  ->where('end_time', '>', $startTime);
            });
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForParking($query, int $parkingId)
    {
        return $query->where('parking_id', $parkingId);
    }

    /**
     * 🆕 Scope: bookings for a specific offer.
     */
    public function scopeForOffer($query, int $offerId)
    {
        return $query->where('parking_offer_id', $offerId);
    }

    /**
     * 🆕 Scope: bookings where user is the owner (via parking or offer).
     */
    public function scopeForOwner($query, int $ownerId)
    {
        return $query->where(function ($q) use ($ownerId) {
            $q->whereHas('parking', function ($sq) use ($ownerId) {
                $sq->where('owner_id', $ownerId);
            })->orWhereHas('parkingOffer', function ($sq) use ($ownerId) {
                $sq->where('owner_id', $ownerId);
            });
        });
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_time', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where('end_time', '<', now());
    }

    /**
     * 🆕 Scope: bookings that need owner approval.
     */
    public function scopePendingApproval($query)
    {
        return $query->where('booking_status', BookingStatus::PendingOwnerApproval);
    }

    // ─── Accessors ───

    public function getDurationInHoursAttribute(): float
    {
        return round($this->start_time->diffInMinutes($this->end_time) / 60, 2);
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->booking_status instanceof BookingStatus && $this->booking_status->isActive();
    }

    /**
     * 🆕 Get the parking offer owner if this is an offer-based booking.
     */
    public function getOfferOwnerAttribute(): ?User
    {
        return $this->parkingOffer?->owner;
    }

    // ─── Methods ───

    public function canBeCancelled(): bool
    {
        return in_array($this->booking_status, [
            BookingStatus::Pending,
            BookingStatus::PendingOwnerApproval,
            BookingStatus::Approved,
        ]);
    }

    public function cancel(string $reason = null): void
    {
        $this->update([
            'booking_status' => BookingStatus::Cancelled,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        if ($this->parking) {
            $this->parking->updateAvailability();
        }
    }

    public function approve(): void
    {
        $this->update([
            'booking_status' => BookingStatus::Approved,
            'approved_at' => now(),
        ]);
    }

    public function complete(): void
    {
        $this->update([
            'booking_status' => BookingStatus::Completed,
            'completed_at' => now(),
        ]);

        if ($this->parking) {
            $this->parking->updateAvailability();
        }
    }

    // ─── 🆕 Marketplace Lifecycle Methods ───

    /**
     * Owner rejects the booking request.
     */
    public function reject(string $reason = null): void
    {
        $this->update([
            'booking_status' => BookingStatus::Rejected,
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Renter starts their trip to the parking location.
     */
    public function startTrip(): void
    {
        $this->update([
            'booking_status' => BookingStatus::RenterOnTheWay,
            'started_at' => now(),
        ]);
    }

    /**
     * Renter has arrived at the parking location.
     */
    public function markArrived(): void
    {
        $this->update([
            'booking_status' => BookingStatus::Arrived,
            'arrived_at' => now(),
        ]);
    }

    /**
     * Owner confirms the renter has arrived.
     */
    public function markOwnerWaiting(): void
    {
        $this->update([
            'booking_status' => BookingStatus::OwnerWaiting,
        ]);
    }

    /**
     * Activate the parking session.
     */
    public function activate(): void
    {
        $this->update([
            'booking_status' => BookingStatus::Active,
        ]);
    }

    /**
     * Mark booking as expired.
     */
    public function markExpired(): void
    {
        $this->update([
            'booking_status' => BookingStatus::Expired,
        ]);
    }

    /**
     * Get the owner of this booking (via parking or parking_offer).
     */
    public function getOwner(): ?User
    {
        if ($this->parkingOffer) {
            return $this->parkingOffer->owner;
        }

        return $this->parking?->owner;
    }
}
