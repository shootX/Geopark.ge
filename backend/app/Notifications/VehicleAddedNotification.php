<?php

namespace App\Notifications;

use App\Models\UserCar;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VehicleAddedNotification extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(public UserCar $car) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'vehicle_added',
            'car_id' => $this->car->id,
            'brand' => $this->car->brand,
            'model' => $this->car->model,
            'plate_number' => $this->car->plate_number,
            'message' => "New vehicle added: {$this->car->brand} {$this->car->model} ({$this->car->plate_number})",
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'car_id' => $this->car->id,
            'brand' => $this->car->brand,
            'model' => $this->car->model,
            'plate_number' => $this->car->plate_number,
            'message' => 'New vehicle added',
        ];
    }

    public function broadcastOn()
    {
        return [
            new PrivateChannel('user.' . $this->car->user_id),
            new PrivateChannel('admin.notifications'),
        ];
    }
}
