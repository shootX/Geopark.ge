<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('brand', 100);
            $table->string('model', 100);
            $table->string('category', 50);
            $table->string('fuel_type', 50);
            $table->unsignedSmallInteger('year');
            $table->string('plate_number', 20)->unique();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('user_id');
            $table->index('category');
            $table->index('fuel_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_cars');
    }
};
