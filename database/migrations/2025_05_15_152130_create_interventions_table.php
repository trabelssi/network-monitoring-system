<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('description');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->string('image_path')->nullable();
            $table->timestamp('action_time')->nullable();
            $table->text('rejection_comment')->nullable();
            $table->string('rejection_image_path')->nullable();
            $table->integer('rating')->nullable();
            $table->text('rating_comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};
