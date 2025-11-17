<template>
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center flex-grow gap-1 min-w-0">
      <template v-if="(source?.user_id || source?.fb_staff_id) && staff_info">
        <StaffAvatar
          v-tooltip="staff_info?.name"
          :id="source?.user_id || source?.fb_staff_id"
          class="rounded-full w-4 h-4 flex-shrink-0"
        />
        <ArrowDown class="-rotate-90 w-2 h-2 text-slate-500 flex-shrink-0" />
      </template>
      <div
        :class="{
          'font-semibold': source?.unread_message_amount,
        }"
        class="text-left truncate text-sm flex-grow min-w-0"
      >
        {{ source?.client_name || 'No name' }}
      </div>
    </div>
    <div
      :key="force_render_key"
      class="flex-shrink-0 text-xs"
    >
      {{ $date_handle.formatCompareCurrentYear(source?.last_message_time) }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { getStaffInfo } from '@/service/function'
import { container } from 'tsyringe'
import { DateHandle } from '@/utils/helper/DateHandle'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'

import ArrowDown from '@/components/Icons/ArrowDown.vue'

import type { ConversationInfo } from '@/service/interface/app/conversation'

const $date_handle = container.resolve(DateHandle)

const $props = withDefaults(
  defineProps<{
    source?: ConversationInfo
  }>(),
  {}
)

/** thông tin của nhân sự được assign */
const staff_info = computed(() => {
  return getStaffInfo(
    $props.source?.fb_page_id,
    $props.source?.user_id || $props.source?.fb_staff_id
  )
})

/**key của div để bắt buộc phần tử phải render lại khi cần thiết */
const force_render_key = ref(0)
/**id của interval */
const interval_id = ref<number | null>(null)

class Main {
  /**render lại thời gian */
  refreshTime() {
    force_render_key.value++
  }
}
const $main = new Main()

// tạo interval khi component được mount
onMounted(() => {
  // lưu id của interval
  interval_id.value = setInterval(() => $main.refreshTime(), 1000 * 30)
})

// xóa interval khi component bị unmount
onUnmounted(() => {
  // nếu interval_id không tồn tại thì không cần xóa
  if (!interval_id.value) return

  // xóa interval
  clearInterval(interval_id.value)
})

onMounted(() => {
  window.addEventListener(
    'chatbox_conversation_refresh_time',
    $main.refreshTime
  )
})
onUnmounted(() => {
  window.removeEventListener(
    'chatbox_conversation_refresh_time',
    $main.refreshTime
  )
})
</script>
