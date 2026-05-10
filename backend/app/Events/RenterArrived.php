<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RenterArrived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Booking $booking,
        public string $method = 'manual', // manual or geofence
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->booking->user_id),
            new PrivateChannel('booking.' . $this->booking->id),
            new PrivateChannel('offer.' . $this->booking->parking_offer_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'renter.arrived';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->booking->id,
            'status' => $this->booking->booking_status->value,
            'method' => $this->method,
        ];
    }
}
