<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Enums\UserRole;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'first_name',
        'last_name',
        'birth_date',
        'personal_number',
        'phone',
        'phone_verified_at',
        'email',
        'password',
        'role',
        'is_active',
        'fcm_token',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'birth_date' => 'date',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'role' => UserRole::class,
        ];
    }

    public function parkings()
    {
        return $this->hasMany(Parking::class, 'owner_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * All vehicles registered by the user.
     */
    public function cars()
    {
        return $this->hasMany(UserCar::class);
    }

    /**
     * The user's default (primary) vehicle.
     */
    public function defaultCar()
    {
        return $this->hasOne(UserCar::class)->where('is_default', true);
    }

    /**
     * Check if the user has at least one registered vehicle.
     */
    public function hasVehicle(): bool
    {
        return $this->cars()->exists();
    }

    public function sentOffers()
    {
        return $this->hasMany(Offer::class, 'sender_id');
    }

    public function receivedOffers()
    {
        return $this->hasMany(Offer::class, 'receiver_id');
    }

    public function pricingRules()
    {
        return $this->hasMany(PricingRule::class, 'created_by');
    }

    // ─── 🆕 Marketplace Relationships ───

    /**
     * Parking offers owned by this user.
     */
    public function parkingOffers()
    {
        return $this->hasMany(ParkingOffer::class, 'owner_id');
    }

    /**
     * User's wallet.
     */
    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    /**
     * Transactions where user is the renter.
     */
    public function renterTransactions()
    {
        return $this->hasMany(Transaction::class, 'renter_id');
    }

    /**
     * Transactions where user is the owner.
     */
    public function ownerTransactions()
    {
        return $this->hasMany(Transaction::class, 'owner_id');
    }

    /**
     * Ratings given by this user.
     */
    public function givenRatings()
    {
        return $this->hasMany(Rating::class, 'from_user_id');
    }

    /**
     * Ratings received by this user.
     */
    public function receivedRatings()
    {
        return $this->hasMany(Rating::class, 'to_user_id');
    }

    /**
     * Live locations for this user.
     */
    public function liveLocations()
    {
        return $this->hasMany(LiveLocation::class);
    }

    // ─── Scopes ───

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, UserRole $role)
    {
        return $query->where('role', $role->value);
    }

    public function scopeTopRated($query)
    {
        return $query->where('total_reviews', '>', 0)->orderBy('average_rating', 'desc');
    }

    // ─── Accessors ───

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getIsPhoneVerifiedAttribute(): bool
    {
        return !is_null($this->phone_verified_at);
    }

    // ─── Role Checks ───

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isOwner(): bool
    {
        return $this->role === UserRole::Owner;
    }

    public function isRegularUser(): bool
    {
        return $this->role === UserRole::User;
    }

    /**
     * Get the total number of completed bookings (as renter).
     */
    public function getCompletedTripsCountAttribute(): int
    {
        return $this->bookings()->where('booking_status', 'completed')->count();
    }

    public function markPhoneAsVerified(): void
    {
        $this->update(['phone_verified_at' => now()]);
    }

    public function routeNotificationForFcm(): ?string
    {
        return $this->fcm_token;
    }
}
