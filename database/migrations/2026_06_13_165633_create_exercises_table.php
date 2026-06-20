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
        Schema::create('exercises', function (Blueprint $table) {
                        $table->id();
            $table->string('name');
            $table->string('muscle_group');
            $table->text('instructions')->nullable();
            $table->text('notes')->nullable();
            $table->integer('default_sets')->default(3);
            $table->integer('default_reps')->default(10);
            $table->integer('default_rest_time')->default(60);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
