<template>
    <div class="message-box break-words whitespace-pre-line bg-[#FFF8E1]">
        {{ text }}
    </div>
</template>
<script setup lang="ts">
const $props = withDefaults(defineProps<{
    /**nội dung tin nhắn của page */
    text: string
}>(), {})
</script>