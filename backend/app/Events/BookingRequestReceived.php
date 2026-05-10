<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingRequestReceived implements ShouldBroadcast
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

        if ($this->booking->parking_offer_id) {
            $channels[] = new PrivateChannel('offer.' . $this->booking->parking_offer_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'booking.request.received';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->booking->id,
            'parking_offer_id' => $this->booking->parking_offer_id,
            'user_id' => $this->booking->user_id,
            'start_time' => $this->booking->start_time->toIso8601String(),
            'end_time' => $this->booking->end_time->toIso8601String(),
            'status' => $this->booking->booking_status->value,
            'total_price' => $this->booking->total_price,
        ];
    }
}
