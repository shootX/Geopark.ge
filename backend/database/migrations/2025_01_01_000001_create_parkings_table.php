<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parkings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->integer('total_slots');
            $table->integer('available_slots');
            $table->decimal('base_price', 10, 2);
            $table->json('images')->nullable();
            $table->string('status')->default('active');
            $table->time('opening_time')->default('08:00');
            $table->time('closing_time')->default('22:00');
            $table->json('amenities')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->softDeletes();
            $table->timestamps();

            $table->index('status');
            $table->index(['latitude', 'longitude']);
            $table->index('owner_id');
            $table->index('base_price');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parkings');
    }
};
