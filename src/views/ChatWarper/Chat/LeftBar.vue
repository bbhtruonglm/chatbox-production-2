<template>
  <div
    id="chat__left-bar"
    class="bg-white w-full h-full rounded-xl flex flex-col overflow-hidden flex-shrink-0 p-2 gap-2"
  >
    <Header :is_loading="is_loading" />
    <Conversation />
  </div>
</template>

<script setup lang="ts">
import Conversation from '@/views/ChatWarper/Chat/LeftBar/Conversation.vue'
import Header from '@/views/ChatWarper/Chat/LeftBar/Header.vue'
// props
defineProps<{
  /** có nên hiển thị skeleton loading ko */
  is_loading?: boolean
}>()
</script>
