<template>
  <div class="flex items-center p-2 gap-3 hover:bg-gray-100 rounded-md">
    <!-- avatar -->
    <div class="flex items-center flex-1 overflow-hidden gap-5">
      <img
        :src="avatar_member"
        alt="avatar"
        class="w-8 h-8 flex-shrink-0 rounded-full"
      />
      <!-- Tên thành viên -->
      <p
        class="flex flex-1 flex-col text-sm truncate overflow-hidden font-semibold flex-shrink-0"
      >
        {{ name_member }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/*Prod truyền vào từ cha**/
defineProps<{
  /**Avarta thành viên*/
  avatar_member: string
  /**Tên thành viên*/
  name_member: string
}>()
</script>
