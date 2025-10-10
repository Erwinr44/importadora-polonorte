<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('category'); // email, whatsapp, notifications
            $table->string('type')->default('text'); // text, password, number, boolean, select
            $table->string('label');
            $table->text('description')->nullable();
            $table->boolean('is_sensitive')->default(false);
            $table->timestamps();
            
            $table->index('category');
            $table->index('key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};