<template>
  <div class="w-48 bg-white rounded-md p-2 flex flex-col gap-1 overflow-y-auto">
    <MenuItem
      @click="connectPageStore.selectMenu(key)"
      v-for="{ key, title, icon, class_icon } of list_platform"
      :icon="icon ?? ClockIcon"
      :title="title"
      :is_selected="isSelectedMenu(key)"
      :class_icon="class_icon"
    />
  </div>
</template>
<script setup lang="ts">
import MenuItem from '@/components/Main/Dashboard/MenuItem.vue'
import { useI18n } from 'vue-i18n'
import { ref, markRaw } from 'vue'
import { useConnectPageStore } from '@/stores'
import { composableService } from '@/views/Dashboard/ConnectPage/service'

import ClockIcon from '@/components/Icons/Clock.vue'
import FacebookIcon from '@/components/Icons/Facebook.vue'
import ZaloIcon from '@/components/Icons/Zalo.vue'
import WebIcon from '@/components/Icons/Web.vue'
import UsersIcon from '@/components/Icons/Users.vue'

import type { Component } from 'vue'

const { ICON_MAP } = composableService()

const { t: $t } = useI18n()
const connectPageStore = useConnectPageStore()

/** một phần tử của nền tảng */
interface PlatformItem {
  /** Khóa */
  key: string
  /** Tiêu đề */
  title: string
  /** Icon vue */
  icon?: Component
  /** Icon class custom */
  class_icon?: string
}

/** Danh sách các nền tảng */
const list_platform = ref<PlatformItem[]>(getPlatform())

/** Kiểm tra xem menu có được chọn không */
function isSelectedMenu(key: string) {
  /**
   * Zalo là case đặc biệt:
   * - Menu bên trái chỉ có 1 item "ZALO"
   * - Nhưng bên trong flow reconnect/current_menu có thể là "ZALO_OA" hoặc "ZALO_PERSONAL"
   * Vì vậy cần coi cả hai trạng thái con này đều đang active menu Zalo.
   */
  if (key === 'ZALO') return connectPageStore.current_menu?.includes('ZALO')
  return key === connectPageStore.current_menu
}
/**khởi tạo danh sách menu */
function getPlatform(): PlatformItem[] {
  /** Menu mặc định */
  const DEFAULT_MENU: PlatformItem[] = [
    {
      key: 'PAGE',
      title: $t('v1.view.main.dashboard.select_platform.active_page'),
      icon: markRaw(ClockIcon),
    },
    {
      key: 'MEMBER',
      title: $t('v1.view.main.dashboard.org.setting.member'),
      icon: markRaw(UsersIcon),
    },
  ]

  /** Danh sách nền tảng */
  const LIST_PLATFORM_MENU: PlatformItem[] = $env.platform?.map(
    platform_key => ({
      key: platform_key,
      title: $t(`v1.common.${platform_key.toLowerCase()}`),
      icon: ICON_MAP[platform_key],
      class_icon: 'w-4 h-4',
    })
  )

  // Trả về danh sách menu
  return [...DEFAULT_MENU, ...LIST_PLATFORM_MENU]
}
</script>
