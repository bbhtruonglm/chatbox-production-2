<template>
  <Alert
    @close_modal="$emit('close_modal')"
    ref="alert_over_quota_ref"
    class_modal="w-[507px]"
    class_body="text-zinc-500"
    class_footer="flex justify-between items-center mt-6"
  >
    <template #header>
      {{ title || $t('v1.view.main.dashboard.org_page.over_quota.title') }}
    </template>
    <template #body>
      {{
        description || $t('v1.view.main.dashboard.chat.error.org_quota_staff')
      }}
    </template>
    <template #footer>
      <button
        @click="closeModal"
        class="btn-custom bg-slate-100 text-slate-500"
      >
        {{ $t('v1.common.close') }}
      </button>
      <button
        @click="confirm"
        class="btn-custom bg-red-100 text-red-500"
      >
        {{ $t('v1.common.ok') }}
      </button>
    </template>
  </Alert>
</template>
<script setup lang="ts">
import { ref } from 'vue'

import Alert from '@/components/Alert.vue'

const $props = withDefaults(
  defineProps<{
    /**tiêu đề modal */
    title?: string
    /**nội dung modal */
    description?: string
  }>(),
  {}
)

const $emit = defineEmits(['close_modal', 'confirm'])

/**modal xác nhận huỷ trang */
const alert_over_quota_ref = ref<InstanceType<typeof Alert>>()

/**ẩn hiện modal của component */
function toggleModal() {
  alert_over_quota_ref.value?.toggleModal()
}
/**tắt modal */
function closeModal() {
  /** gửi sự kiện đóng modal */
  $emit('close_modal')

  /** ẩn modal */
  toggleModal()
}
function confirm() {
  /** gửi sự kiện xác nhận */
  $emit('confirm')

  /** ẩn modal */
  toggleModal()
}

defineExpose({ toggleModal })
</script>
<style scoped lang="scss">
.btn-custom {
  @apply text-sm font-medium rounded-md py-2 px-4 flex items-center gap-2 hover:brightness-90;
}
</style>
