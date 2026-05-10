<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'renter_id',
        'owner_id',
        'total_amount',
        'platform_fee',
        'owner_amount',
        'status',
        'held_at',
        'released_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'float',
            'platform_fee' => 'float',
            'owner_amount' => 'float',
            'status' => TransactionStatus::class,
            'held_at' => 'datetime',
            'released_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    // ─── Relationships ───

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function renter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'renter_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    // ─── Scopes ───

    public function scopeHeld($query)
    {
        return $query->where('status', TransactionStatus::Held);
    }

    public function scopeReleased($query)
    {
        return $query->where('status', TransactionStatus::Released);
    }

    public function scopeByStatus($query, TransactionStatus $status)
    {
        return $query->where('status', $status->value);
    }

    // ─── Methods ───

    /**
     * Calculate fees for a given amount.
     * Platform fee is 3%.
     */
    public static function calculateFees(float $totalAmount): array
    {
        $platformFee = round($totalAmount * 0.03, 2);
        $ownerAmount = round($totalAmount - $platformFee, 2);

        return [
            'total_amount' => $totalAmount,
            'platform_fee' => $platformFee,
            'owner_amount' => $ownerAmount,
        ];
    }

    /**
     * Mark transaction as released.
     */
    public function release(): void
    {
        $this->update([
            'status' => TransactionStatus::Released,
            'released_at' => now(),
        ]);
    }

    /**
     * Mark transaction as refunded.
     */
    public function refund(): void
    {
        $this->update([
            'status' => TransactionStatus::Refunded,
            'refunded_at' => now(),
        ]);
    }

    /**
     * Mark transaction as failed.
     */
    public function markAsFailed(): void
    {
        $this->update(['status' => TransactionStatus::Failed]);
    }
}
