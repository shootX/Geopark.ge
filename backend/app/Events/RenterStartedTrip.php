<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RenterStartedTrip implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('user.' . $this->booking->user_id),
            new PrivateChannel('booking.' . $this->booking->id),
        ];

        $owner = $this->booking->getOwner();
        if ($owner) {
            $channels[] = new PrivateChannel('user.' . $owner->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'renter.started.trip';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->booking->id,
            'status' => $this->booking->booking_status->value,
            'start_time' => $this->booking->start_time->toIso8601String(),
        ];
    }
}
