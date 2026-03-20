<template>
  <div class="relative max-w-full">
    <template v-if="isShowArrow()">
      <ArrowDownIcon
        @click="moveSlider('LEFT')"
        class="custom-btn rotate-90 -left-5"
      />
      <ArrowDownIcon
        @click="moveSlider('RIGHT')"
        class="custom-btn -rotate-90 -right-5"
      />
    </template>
    <div
      ref="slider_warper_ref"
      class="overflow-x-auto scroll-smooth flex gap-1"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

import ArrowDownIcon from '@/components/Icons/ArrowDown.vue'

const $props = withDefaults(
  defineProps<{
    /**đếm số phần tử */
    count_element?: number
  }>(),
  {}
)

/**ref của slider */
const slider_warper_ref = ref<HTMLElement>()

/**di chuyển các item bên trong slider */
function moveSlider(direction: 'LEFT' | 'RIGHT') {
  // nếu chưa có ref thì không làm gì cả
  if (!slider_warper_ref.value) return

  /**độ rộng của 1 slider */
  const WIDTH = 300

  // qua trái
  if (direction === 'LEFT') slider_warper_ref.value.scrollLeft -= WIDTH

  // qua phải
  if (direction === 'RIGHT') slider_warper_ref.value.scrollLeft += WIDTH
}
/**quản lý việc hiển thị mũi tên điều hướng */
function isShowArrow() {
  return ($props.count_element || 0) > 1
}
</script>
<style scoped lang="scss">
.custom-btn {
  @apply cursor-pointer w-4 h-4 absolute flex-shrink-0 z-10 top-1/2 -translate-y-1/2;
}
</style>
