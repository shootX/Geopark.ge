<?php

namespace App\Notifications;

use App\Models\Offer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OfferReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Offer $offer) {}

    public function via($notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Offer Received')
            ->greeting('Hello ' . $notifiable->first_name . '!')
            ->line('You have received a new offer of $' . number_format($this->offer->price_offer, 2))
            ->line('Message: ' . $this->offer->message)
            ->action('View Offer', url('/api/v1/offers/' . $this->offer->id))
            ->line('Please respond to this offer before it expires.');
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'offer_received',
            'offer_id' => $this->offer->id,
            'sender_name' => $this->offer->sender->full_name,
            'booking_id' => $this->offer->booking_id,
            'price_offer' => $this->offer->price_offer,
            'message' => $this->offer->message,
            'status' => $this->offer->status->value,
        ];
    }

    public function toBroadcast($notifiable): array
    {
        return [
            'type' => 'offer_received',
            'offer_id' => $this->offer->id,
            'sender_name' => $this->offer->sender->full_name,
            'price_offer' => $this->offer->price_offer,
            'message' => 'New offer of $' . number_format($this->offer->price_offer, 2) . ' received',
        ];
    }
}
