<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UsersLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Booking $booking,
        public int $userId,
        public float $latitude,
        public float $longitude,
        public ?float $heading = null,
        public ?float $speed = null,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
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
        return 'location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'booking_id' => $this->booking->id,
            'user_id' => $this->userId,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'heading' => $this->heading,
            'speed' => $this->speed,
        ];
    }
}
