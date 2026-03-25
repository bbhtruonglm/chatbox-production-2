<template>
  <div class="relative">
    <img
      class="absolute top-2 left-3 w-5 h-5"
      src="@/assets/icons/search.svg"
    />
    <input
      v-model.trim="model"
      :placeholder="placeholder"
      class="w-full rounded-full py-2 pl-10 pr-3 text-sm focus:outline-orange-500"
    />
  </div>
</template>

<script setup lang="ts">
/** Khai báo v-model */
const model = defineModel<string>()

withDefaults(
  defineProps<{
    /**placeholder của input */
    placeholder?: string
  }>(),
  {}
)
</script>
