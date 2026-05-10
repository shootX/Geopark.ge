<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'from_user_id',
        'to_user_id',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    // ─── Relationships ───

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    // ─── Scopes ───

    public function scopeForUser($query, int $userId)
    {
        return $query->where('to_user_id', $userId);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('from_user_id', $userId);
    }

    public function scopeHighRating($query, int $min = 4)
    {
        return $query->where('rating', '>=', $min);
    }

    public function scopeForBooking($query, int $bookingId)
    {
        return $query->where('booking_id', $bookingId);
    }

    // ─── Methods ───

    /**
     * Recalculate and update the average rating for the target user.
     */
    public static function recalculateUserRating(int $userId): void
    {
        $stats = self::where('to_user_id', $userId)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        User::where('id', $userId)->update([
            'average_rating' => round($stats->avg_rating ?? 0, 1),
            'total_reviews' => $stats->total ?? 0,
        ]);
    }
}
