<template>
  <splitpanes
    @resized="onResized"
    ref="container_ref"
    class="!w-full !h-full flex custom default-theme flex-grow min-w-0"
  >
    <pane
      :min-size="min"
      :max-size="max"
      :size="size"
      class="h-full !text-sm flex-shrink-0"
      :style="
        !ready && {
          width: `${size}%`,
          minWidth: `${size}%`,
          maxWidth: `${size}%`,
        }
      "
    >
      <slot name="left" />
    </pane>
    <pane
      class="h-full !bg-transparent !text-sm"
      :size="100 - size"
    >
      <slot name="right" />
    </pane>
  </splitpanes>
</template>

<script setup lang="ts">
import { LocalStorage } from '@/utils/helper/LocalStorage'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { container } from 'tsyringe'
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'

/** độ rộng tối thiểu của cột bên trái */
const MIN = 360
/** độ rộng tối đa của cột bên trái */
const MAX = 460

/** ref tới thẻ splitpanes bọc bên ngoài */
const container_ref = ref<InstanceType<typeof Splitpanes>>()
/** cờ check để render các thành phần bên trong tránh bị giật khi chiều rộng đang được tính toán */
const ready = ref(false)
/** chiều rộng của thẻ bọc ngoài cùng */
const width = ref(0)
/** chiều rộng của cột bên trái theo %*/
const size = ref(0)

/** chiều rộng tối thểu cột bên trái theo % */
const min = computed(() => round((MIN / width.value) * 100))
/** chiều rộng tối đa cót bên trái theo % */
const max = computed(() => round((MAX / width.value) * 100))

const $local_storage = container.resolve(LocalStorage)

onBeforeMount(() => {
  // chiều rộng cột bên trái lưu ở local
  const LOCAL_WIDTH = $local_storage.getItem('conversation_width')

  // set chiều rộng tối thiểu cót bên trái
  size.value = LOCAL_WIDTH
})

onMounted(() => {
  // nếu không có thẻ splitpanes bọc bên ngoài thì bỏ qua
  if (!container_ref.value) return

  // lưu lại chiều rộng của thẻ bọc
  width.value = container_ref.value?.$el?.clientWidth

  // chiều rộng cột bên trái lưu ở local
  const LOCAL_WIDTH = $local_storage.getItem('conversation_width') || 0

  // set chiều rộng tối thiểu cột bên trái
  // nếu độ rộng vượt quá giới hạn thì cài về tối thiểu
  if (LOCAL_WIDTH < min.value || LOCAL_WIDTH > max.value) size.value = min.value
  // nếu không vượt quá giới hạn thì dùng từ local
  else size.value = LOCAL_WIDTH

  // lưu local giá trị của chiều rộng cột bên trái
  $local_storage.setItem('conversation_width', round(size.value))

  // bật cờ để render ra các thành phần bên trong
  nextTick(() => {
    ready.value = true
  })
})

/** cập nhật chiều rộng cột bên trái */
function onResized({ prevPane }: { prevPane?: { size: number } }) {
  // nếu không có dữ liệu mới của thẻ được chỉnh sửa
  if (!prevPane?.size) return

  // lưu lại chiều rộng cột bên trái
  size.value = prevPane.size

  // lưu local giá trị của chiều rộng cột bên trái
  $local_storage.setItem('conversation_width', round(size.value))
}

/** làm tròn số thập thứ 2 */
function round(num: number) {
  return Math.round(num * 100) / 100
}
</script>

<style>
.custom.default-theme.splitpanes--vertical > .splitpanes__splitter {
  display: block;
  width: 10px;
  height: 100%;
  border-left: none;
  background: transparent;
}
</style>
