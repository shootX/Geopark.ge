<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained('parking_offers')->cascadeOnDelete();
            $table->integer('day_of_week')->nullable(); // 0=Sun, 1=Mon... null = specific date
            $table->date('specific_date')->nullable();
            $table->time('from_time');
            $table->time('until_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->index('offer_id');
            $table->index(['day_of_week', 'from_time', 'until_time']);
            $table->index('specific_date');

            // Ensure either day_of_week or specific_date is set, not both
            // This is a business rule we enforce at app level, not DB constraint
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_availability');
    }
};
