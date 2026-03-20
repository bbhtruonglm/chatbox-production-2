<template>
  <splitpanes
    @resized="onResized"
    ref="container_ref"
    class="!w-full !h-full flex custom default-theme flex-grow min-w-0" 
  >
    <pane
      id="left"
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
      id="center"
      class="h-full !bg-transparent !text-sm min-w-0"
      :size="100 - size - right_size"
    >
      <slot name="center" />
    </pane>
    <pane
      :min-size="min"
      :max-size="max"
      :size="right_size"
      class="h-full flex-shrink-0"
      :style="
        !ready && {
          width: `${right_size}%`,
          minWidth: `${right_size}%`,
          maxWidth: `${right_size}%`,
        }
      "
    >
      <slot name="right" />
    </pane>
  </splitpanes>
</template>

<script setup lang="ts">
import { LocalStorage } from '@/utils/helper/LocalStorage'
import { read } from '@popperjs/core'
import { log } from 'async'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { container } from 'tsyringe'
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'

/** độ rộng tối thiểu của cột bên trái */
const MIN = 250
/** độ rộng tối đa của cột bên trái */
const MAX = 460

/** giá trị mặc định của 2 cột trái phải */
const DEFAULT = 330

/** ref tới thẻ splitpanes bọc bên ngoài */
const container_ref = ref<InstanceType<typeof Splitpanes>>()
/** cờ check để render các thành phần bên trong tránh bị giật khi chiều rộng đang được tính toán */
const ready = ref(false)
/** chiều rộng của thẻ bọc ngoài cùng */
const width = ref(0)
/** chiều rộng của cột bên trái theo %*/
const size = ref(0)
/** chiều rộng cót bên phải theo % */
const right_size = ref(0)

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
  const LOCAL_CONVERSATION_WIDTH =
    $local_storage.getItem('conversation_width') || 0

  /** chiều rộng của cột widget */
  const LOCAL_WIDTH_WIDGET = $local_storage.getItem('widget_width') || 0

  // set chiều rộng tối thiểu cột bên trái
  // nếu độ rộng vượt quá giới hạn thì cài về tối thiểu
  if (
    LOCAL_CONVERSATION_WIDTH < min.value ||
    LOCAL_CONVERSATION_WIDTH > max.value
  ) {
    size.value = round((DEFAULT / width.value) * 100)
  }
  // nếu không vượt quá giới hạn thì dùng từ local
  else {
    size.value = LOCAL_CONVERSATION_WIDTH
  }

  // set chiều rộng tối đa cót bên phải
  // nếu độ rộng vượt quá giới hạn thì cài về tối thiểu
  if (LOCAL_WIDTH_WIDGET > max.value || LOCAL_WIDTH_WIDGET < min.value) {
    right_size.value = round((DEFAULT / width.value) * 100)
  }
  // nếu không vượt quá giới hạn thì dùng từ local
  else {
    right_size.value = LOCAL_WIDTH_WIDGET
  }

  // lưu local giá trị của chiều rộng cột bên trái
  $local_storage.setItem('conversation_width', round(size.value))

  // lưu local giá trị của chiều rộng cót bên phải
  $local_storage.setItem('widget_width', round(right_size.value))

  // đợi 300ms để thư viện cập nhật
  setTimeout(() => {
    ready.value = true
  }, 300)
})

/** cập nhật chiều rộng cột bên trái */
function onResized({
  prevPane,
}: {
  prevPane?: { size: number; el: HTMLElement }
}) {
  console.log(prevPane?.el?.id)

  // nếu không có dữ liệu mới của thẻ được chỉnh sửa
  if (!prevPane?.size) return

  if (prevPane.el.id === 'left') {
    // lưu lại chiều rộng cột bên trái
    size.value = prevPane.size
    // lưu local giá trị của chiều rộng cột bên trái
    $local_storage.setItem('conversation_width', round(size.value))
  }

  if (prevPane.el.id === 'center') {
    console.log(prevPane);
    // lưu lại chiều rộng cót bên phải
    right_size.value = 100 - size.value - prevPane.size
    // lưu local giá trị của chiều rộng cót bên phải
    $local_storage.setItem('widget_width', round(right_size.value))
  }
}

/** làm tròn số thập thứ 2 */
function round(num: number) {
  return Math.round(num * 100) / 100
}
</script>

<style scoped>
.custom.default-theme.splitpanes--vertical :deep(> .splitpanes__splitter) {
  display: block;
  width: 10px;
  height: 100%;
  border-left: none;
  background: transparent;
}
.custom.default-theme.splitpanes .splitpanes__pane {
  background: transparent;
}
</style>
