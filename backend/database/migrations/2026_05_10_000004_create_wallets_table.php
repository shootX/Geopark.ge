<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->unique();
            $table->decimal('balance', 12, 2)->default(0);
            $table->string('currency', 3)->default('GEL');
            $table->boolean('is_blocked')->default(false);
            $table->timestamps();

            $table->index('user_id');
            $table->index('is_blocked');
        });

        // Create wallets for all existing users
        DB::statement('INSERT INTO wallets (user_id, balance, currency, created_at, updated_at)
            SELECT id, 0, \'GEL\', NOW(), NOW() FROM users
            WHERE id NOT IN (SELECT user_id FROM wallets)');
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
