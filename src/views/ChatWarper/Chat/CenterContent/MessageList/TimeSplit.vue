<template>
  <div
    v-if="isShowTimeSplit()"
    class="px-3 text-slate-100 w-fit mx-auto bg-slate-600 rounded-lg text-center text-xs font-medium my-2"
  >
    {{ formatNowDate() }}
  </div>
</template>
<script setup lang="ts">
import { format as date_format, isSameDay } from 'date-fns'

import type { MessageInfo } from '@/service/interface/app/message'

const $props = withDefaults(
  defineProps<{
    /**dữ liệu tin nhắn trước đó */
    before_message?: MessageInfo
    /**dữ liệu tin nhắn hiện tại */
    now_message: MessageInfo
  }>(),
  {}
)

/**xử lý lại kiểu thời gian của tin nhắn hiện tại */
function formatNowDate() {
  /**thời gian của cua tin nhắn hiện tại */
  const DATE = $props.now_message?.createdAt
  // const DATE = $props.now_message.time || $props.now_message.createdAt

  // format theo template
  return date_format(new Date(DATE), 'HH:mm, dd/MM/yyyy')
}
/**chỉ hiện thị khoảng ngắt thời gian khi cách ngày */
function isShowTimeSplit() {
  /**thời gian của tin nhắn hiện tại */
  const NOW_DATE = $props.now_message?.createdAt
  // const NOW_DATE = $props.now_message.time || $props.now_message.createdAt
  /**thời gian của tin nhắn trước đó */
  const BEFORE_DATE = $props.before_message?.createdAt
  // const BEFORE_DATE =
  //   $props.before_message?.time || $props.before_message?.createdAt
  
  // nếu trước đó không có tin nhắn thì thôi
  if (!BEFORE_DATE || !NOW_DATE) return false

  // nếu cùng ngày thì thôi
  if (isSameDay(new Date(NOW_DATE), new Date(BEFORE_DATE))) return false

  // nếu khác ngày thì hiện thị
  return true
}
</script>
