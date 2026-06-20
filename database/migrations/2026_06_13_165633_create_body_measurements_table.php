<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('body_measurements', function (Blueprint $table) {
                        $table->id();
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('body_fat', 5, 2)->nullable();
            $table->decimal('chest', 8, 2)->nullable();
            $table->decimal('waist', 8, 2)->nullable();
            $table->decimal('shoulders', 8, 2)->nullable();
            $table->decimal('arms', 8, 2)->nullable();
            $table->decimal('forearms', 8, 2)->nullable();
            $table->decimal('thighs', 8, 2)->nullable();
            $table->decimal('calves', 8, 2)->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('body_measurements');
    }
};
