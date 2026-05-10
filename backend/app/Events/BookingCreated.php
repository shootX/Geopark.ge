<?php

namespace App\Events;

use App\Models\Booking;
use App\Models\Parking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('parking.' . $this->booking->parking_id),
            new PrivateChannel('user.' . $this->booking->user_id),
            new PrivateChannel('owner.' . $this->booking->parking->owner_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'booking.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->booking->id,
            'parking_id' => $this->booking->parking_id,
            'user_id' => $this->booking->user_id,
            'start_time' => $this->booking->start_time->toIso8601String(),
            'end_time' => $this->booking->end_time->toIso8601String(),
            'status' => $this->booking->booking_status->value,
            'total_price' => $this->booking->total_price,
        ];
    }
}
