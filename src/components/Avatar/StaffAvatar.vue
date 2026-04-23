<template>
  <div
    :id="`staff-read-item-${id}`"
    :class="animate_pulse"
    class="overflow-hidden bg-slate-200"
  >
    <img
      loading="lazy"
      :src="loadImageUrl()"
      @error="onImageError"
      @load="removeAnimatePulse"
      class="w-full h-full object-cover"
    />
  </div>
</template>
<script setup lang="ts">
import { SingletonCdn } from '@/utils/helper/Cdn'
import { ref } from 'vue'

const $props = withDefaults(
  defineProps<{
    id?: string
  }>(),
  {}
)

const $cdn = SingletonCdn.getInst()

/**kích thước thực tế */
const SIZE = 64
const DEFAULT_AVATAR = `${$env.img_host}/1111111111?width=${SIZE}&height=${SIZE}`
/**thêm hiệu ứng ẩn hiện khi ảnh đang được load */
const animate_pulse = ref('animate-pulse')

/**tắt hiệu ứng ẩn hiện khi ảnh load thành công */
function removeAnimatePulse() {
  animate_pulse.value = ''
}
/**khi ảnh load thất bại thì thay thế ảnh mặc định vào */
function onImageError($event: Event) {
  const image = $event.target as HTMLImageElement

  image.src = DEFAULT_AVATAR
}
/**lấy id của fb */
function getFbAsId() {
  return $props.id?.trim()
}
/**tạo url ảnh */
function loadImageUrl() {
  const STAFF_ID = getFbAsId()

  if (!STAFF_ID) return DEFAULT_AVATAR

  return $cdn.userAvt(STAFF_ID)
}
</script>
