<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingCreatedNotification extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    public function via($notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url', url('/'));
        $bookingUrl = $frontendUrl . '/booking/' . $this->booking->id;

        return (new MailMessage)
            ->subject('Booking Created - ' . $this->booking->parking->title)
            ->greeting('Hello ' . $notifiable->first_name . '!')
            ->line('Your booking has been created successfully.')
            ->line('Parking: ' . $this->booking->parking->title)
            ->line('Start: ' . $this->booking->start_time->format('M d, Y H:i'))
            ->line('End: ' . $this->booking->end_time->format('M d, Y H:i'))
            ->line('Total: $' . number_format($this->booking->total_price, 2))
            ->action('View Booking', $bookingUrl)
            ->line('Thank you for using our platform!');
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'booking_created',
            'booking_id' => $this->booking->id,
            'parking_id' => $this->booking->parking_id,
            'parking_title' => $this->booking->parking->title,
            'start_time' => $this->booking->start_time->toDateTimeString(),
            'end_time' => $this->booking->end_time->toDateTimeString(),
            'total_price' => $this->booking->total_price,
            'status' => $this->booking->booking_status->value,
            'message' => 'New booking at ' . $this->booking->parking->title,
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'parking_title' => $this->booking->parking->title,
            'message' => 'New booking created',
        ];
    }

    public function broadcastOn()
    {
        return [
            new PrivateChannel('user.' . $this->booking->user_id),
            new PrivateChannel('admin.notifications'),
        ];
    }
}
