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
        Schema::create('device_discoveries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('device_id');
            $table->string('status')->default('unknown'); // online/offline/unknown
            $table->timestamp('discovered_at');
            $table->string('message')->nullable();
            $table->timestamps();

            $table->foreign('device_id')->references('id')->on('device')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_discoveries');
    }
}; 