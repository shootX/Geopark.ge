<?php

namespace App\Notifications;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class VehicleDeletedNotification extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public int $carId,
        public string $plateNumber,
        public ?int $userId = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'vehicle_deleted',
            'car_id' => $this->carId,
            'plate_number' => $this->plateNumber,
            'message' => "Vehicle deleted: {$this->plateNumber}",
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'car_id' => $this->carId,
            'plate_number' => $this->plateNumber,
            'message' => 'Vehicle deleted',
        ];
    }

    public function broadcastOn()
    {
        $channels = [new PrivateChannel('admin.notifications')];

        if ($this->userId) {
            $channels[] = new PrivateChannel('user.' . $this->userId);
        }

        return $channels;
    }
}
