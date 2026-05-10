<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    public function via($notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Booking Approved - ' . $this->booking->parking->title)
            ->greeting('Hello ' . $notifiable->first_name . '!')
            ->line('Your booking has been approved!')
            ->line('Parking: ' . $this->booking->parking->title)
            ->line('Start: ' . $this->booking->start_time->format('M d, Y H:i'))
            ->line('End: ' . $this->booking->end_time->format('M d, Y H:i'))
            ->action('View Booking', url('/api/v1/bookings/' . $this->booking->id))
            ->line('Thank you for using our platform!');
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'booking_approved',
            'booking_id' => $this->booking->id,
            'parking_id' => $this->booking->parking_id,
            'parking_title' => $this->booking->parking->title,
            'start_time' => $this->booking->start_time->toDateTimeString(),
            'end_time' => $this->booking->end_time->toDateTimeString(),
            'message' => 'Your booking at ' . $this->booking->parking->title . ' has been approved!',
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'type' => 'booking_approved',
            'booking_id' => $this->booking->id,
            'message' => 'Booking approved!',
        ];
    }
}
