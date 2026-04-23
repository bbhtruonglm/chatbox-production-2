<template>
  <Modal
    ref="modal_ref"
    class_modal="w-[420px] !bg-white p-4"
    class_body="pt-4 text-sm text-slate-600"
    class_footer="pt-4 flex items-center justify-end gap-2"
  >
    <template #header>
      {{ $t(title) }}
    </template>
    <template #body>
      <div class="space-y-3">
        <div>
          {{ $t(description) }}
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50"
          @click="$emit('continue')"
        >
          {{ $t(continue_text) }}
        </button>
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          @click="$emit('reconnect')"
        >
          {{ $t(reconnect_text) }}
      </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import Modal from '@/components/Modal.vue'

/**
 * Popup cảnh báo quyền truy cập được tách riêng để tái sử dụng.
 * Component này chỉ phụ trách phần hiển thị + emit hành động,
 * còn logic đóng popup / mở ConnectPage sẽ do component cha quyết định.
 */
withDefaults(
  defineProps<{
    title?: string
    description?: string
    continue_text?: string
    reconnect_text?: string
  }>(),
  {
    title: 'Cảnh báo quyền truy cập',
    description: 'Trang này đang mất quyền truy cập, vui lòng cấp lại quyền!',
    continue_text: 'Tiếp tục',
    reconnect_text: 'Cấp lại quyền',
  }
)

defineEmits<{
  (e: 'continue'): void
  (e: 'reconnect'): void
}>()

const modal_ref = ref<InstanceType<typeof Modal>>()

defineExpose({
  /** Cho phép component cha chủ động mở/đóng popup bằng ref giống pattern Modal hiện tại. */
  toggleModal() {
    modal_ref.value?.toggleModal()
  },
})
</script>
