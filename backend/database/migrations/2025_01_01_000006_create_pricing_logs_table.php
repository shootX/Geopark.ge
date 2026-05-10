<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pricing_rule_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('parking_id')->constrained()->cascadeOnDelete();
            $table->string('formula')->nullable();
            $table->json('variables')->nullable();
            $table->decimal('calculated_price', 10, 2);
            $table->decimal('base_price', 10, 2)->default(0);
            $table->decimal('hours', 8, 2)->default(0);
            $table->decimal('demand_factor', 5, 2)->default(1.00);
            $table->decimal('weekend_multiplier', 5, 2)->default(1.00);
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('calculated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('parking_id');
            $table->index('pricing_rule_id');
            $table->index('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_logs');
    }
};
