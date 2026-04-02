<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add edit + pin columns to chat_messages
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->boolean('is_edited')->default(false)->after('reply_to_id');
            $table->timestamp('edited_at')->nullable()->after('is_edited');
            $table->boolean('is_pinned')->default(false)->after('edited_at');
            $table->unsignedBigInteger('pinned_by')->nullable()->after('is_pinned');
            $table->timestamp('pinned_at')->nullable()->after('pinned_by');

            $table->foreign('pinned_by')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Read receipts table
        Schema::create('chat_message_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('message_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('read_at')->useCurrent();

            $table->foreign('message_id')->references('id')->on('chat_messages')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['message_id', 'user_id']);
        });

        // 3. Typing indicators table (ephemeral)
        Schema::create('chat_typing', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('channel_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamp('started_at')->useCurrent();

            $table->foreign('channel_id')->references('id')->on('chat_channels')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['channel_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_typing');
        Schema::dropIfExists('chat_message_reads');

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropForeign(['pinned_by']);
            $table->dropColumn(['is_edited', 'edited_at', 'is_pinned', 'pinned_by', 'pinned_at']);
        });
    }
};
