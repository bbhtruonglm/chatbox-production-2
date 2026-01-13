<template>
  <div
    v-tooltip.bottom="getILabel(page_id, label_id)?.title"
    :tooltip-disabled="getLabelConfig() === 'ICON'"
    v-if="getILabel(page_id, label_id)"
    :style="{ background: getILabel(page_id, label_id)?.bg_color }"
    :class="{
      'w-3 h-3': getLabelConfig()?.includes('ICON'),
    }"
    class="text-white rounded-md text-[9px] truncate px-1 w-12"
  >
    <template v-if="!getLabelConfig()?.includes('ICON')">
      {{ getILabel(page_id, label_id)?.title }}
    </template>
  </div>
</template>
<script setup lang="ts">
import { getILabel, getPageInfo } from '@/service/function'
import { useChatbotUserStore, useOrgStore } from '@/stores'

const $props = withDefaults(
  defineProps<{
    /**id trang */
    page_id?: string
    /**id nhãn */
    label_id: string
  }>(),
  {}
)

const chatbotUserStore = useChatbotUserStore()
const orgStore = useOrgStore()

/**lấy cài đặt nhãn */
function getLabelConfig() {
  // * Trường hợp bật chế độ ghi đè thiết lập page
  if (chatbotUserStore.personal_settings?.is_enable_personal_setting) {
    return (
      (chatbotUserStore.personal_settings.display_label_type as string) ||
      getPageInfo($props.page_id)?.display_label_type ||
      'ICON_TOOLTIP'
    )
  }

  // * Trường hợp không bật chế độ ghi đè thiết lập page
  return (
    orgStore?.selected_org_info?.org_config?.org_display_label_type ||
    'ICON_TOOLTIP'
  )
}
</script>
