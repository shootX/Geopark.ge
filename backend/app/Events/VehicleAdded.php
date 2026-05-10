<?php

namespace App\Events;

use App\Models\UserCar;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public UserCar $car) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->car->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'vehicle.added';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->car->id,
            'brand' => $this->car->brand,
            'model' => $this->car->model,
            'plate_number' => $this->car->plate_number,
        ];
    }
}
