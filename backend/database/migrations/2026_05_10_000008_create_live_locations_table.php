<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->float('heading')->nullable();
            $table->float('speed')->nullable();
            $table->timestamp('updated_at')->useCurrent()->index();

            $table->index('booking_id');
            $table->index('user_id');
            $table->index(['booking_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_locations');
    }
};
