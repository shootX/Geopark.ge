<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parking_id')->nullable()->constrained('parkings')->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('parking_type'); // private, municipal
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->json('supported_vehicle_sizes')->nullable(); // ['sedan','suv','large_suv','van']
            $table->json('features')->nullable(); // ['covered','cameras','security_guard','gated','charging_station']
            $table->decimal('hourly_price', 10, 2);
            $table->integer('minimum_hours')->default(1);
            $table->time('available_from')->nullable();
            $table->time('available_until')->nullable(); // mandatory for private
            $table->boolean('is_active')->default(false);
            $table->string('status')->default('draft'); // draft, active, paused, booked, completed, blocked
            $table->decimal('average_rating', 2, 1)->default(0.0);
            $table->integer('total_reviews')->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('is_active');
            $table->index('owner_id');
            $table->index(['latitude', 'longitude']);
            $table->index('hourly_price');
            $table->index('parking_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_offers');
    }
};
