<?php

namespace App\Events;

use App\Models\Rating;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RatingSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Rating $rating) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->rating->to_user_id),
            new PrivateChannel('booking.' . $this->rating->booking_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'rating.submitted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->rating->id,
            'booking_id' => $this->rating->booking_id,
            'from_user_id' => $this->rating->from_user_id,
            'to_user_id' => $this->rating->to_user_id,
            'rating' => $this->rating->rating,
            'comment' => $this->rating->comment,
        ];
    }
}
