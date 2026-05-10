<?php

namespace App\Events;

use App\Models\Parking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParkingAvailabilityUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Parking $parking) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('parking.' . $this->parking->id),
            new Channel('parkings'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'parking.availability.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->parking->id,
            'available_slots' => $this->parking->available_slots,
            'total_slots' => $this->parking->total_slots,
            'occupancy_rate' => $this->parking->occupancy_rate,
        ];
    }
}
