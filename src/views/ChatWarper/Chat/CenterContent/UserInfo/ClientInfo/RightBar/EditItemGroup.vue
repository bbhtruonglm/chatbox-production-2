<template>
  <div
    v-if="isVisible()"
    class="flex items-start text-sm"
  >
    <div class="w-28 font-semibold ml-5 flex-shrink-0 truncate">
      {{ title }}
    </div>
    <div class="flex flex-col gap-2.5">
      <template v-for="item of source">
        <div
          v-if="item.contact_type === type"
          class="group"
        >
          <div v-if="!conversationStore.is_edit_info">
            {{ item.contact_value }}
          </div>
          <div
            v-else
            class="flex items-center gap-1"
          >
            <input
              v-model="item.contact_value"
              @input="
                conversationStore.is_edit_client.contact_update[item._id!] = 1
              "
              :disabled="isContactEditDisabled"
              :placeholder
              class="py-2 px-3 rounded-md border focus:outline-none w-80 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            <BinIcon
              v-if="!isContactEditDisabled"
              @click="removeContact(item._id!)"
              class="text-slate-500 w-5 h-5 cursor-pointer hidden group-hover:block"
            />
          </div>
        </div>
      </template>
      <div
        v-if="conversationStore.is_edit_info"
        @click="addContact"
        :class="{
          'cursor-pointer': !isContactEditDisabled,
          'cursor-not-allowed opacity-50': isContactEditDisabled,
        }"
        class="text-sm font-medium text-slate-500"
      >
        + {{ create_title }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useConversationStore, useOrgStore } from '@/stores'
import { remove } from 'lodash'
import { confirmSync } from '@/service/helper/alert'
import { useI18n } from 'vue-i18n'

import BinIcon from '@/components/Icons/Bin.vue'

import type { ContactInfo } from '@/utils/api/Ai'

const conversationStore = useConversationStore()
const orgStore = useOrgStore()
const { t: $t } = useI18n()

const $props = withDefaults(
  defineProps<{
    source?: ContactInfo[]
    /**tiêu đề */
    title?: string
    /**hướng dẫn */
    placeholder?: string
    /**tiêu đề cho nút tạo */
    create_title: string
    /**kiểu liên hệ */
    type: ContactInfo['contact_type']
  }>(),
  {}
)

/** 
 * Kiểm tra xem có khóa chỉnh sửa thông tin liên hệ hay không
 * Lấy cấu hình từ PageStore hiện hành hoặc từ Billing OwnerShip (list_os)
 */
//TODO: hiện tại Backend đang chỉ check theo type là PHONE, cần phải bắt thêm type là EMAIL
const isContactEditDisabled = computed(() => {
  // Chỉ áp dụng logic ẩn/khóa chỉnh sửa cho SĐT và Email
  if (!['PHONE', 'EMAIL'].includes($props.type || '')) return false

  /** Dữ liệu trang Fanpage hiện tại của hội thoại */
  const PAGE = conversationStore.getPage()
  /** ID của trang Fanpage */
  const PAGE_ID = PAGE?.fb_page_id
  /** Tên trường cấu hình ẩn thông tin (Hiện tại đang cố định là hide_phone theo yêu cầu TODO) */
  const HIDE_FIELD = 'is_hide_phone'

  // 1. Check trực tiếp trong cấu hình Page mới nhất từ API Billing (list_os)
  if (PAGE_ID && orgStore.list_os?.length) {
    /** Thông tin cấu hình chi tiết của Page trong danh sách OS */
    const os = orgStore.list_os.find((item: any) => item?.page_id === PAGE_ID)
    if (os?.page_info?.[HIDE_FIELD]) return true
  }

  // Ưu tiên 2: Fallback kiểm tra từ dữ liệu Page của Chat server
  // Sử dụng khi dữ liệu từ Billing chưa kịp cập nhật hoặc không tìm thấy
  return !!PAGE?.[HIDE_FIELD]
})

/**
 * Thêm một bản ghi liên hệ mới vào danh sách
 * Để người dùng có thể bổ sung thêm các thông tin liên lạc khác cho khách hàng
 */
function addContact() {
  if (isContactEditDisabled.value) return

  /**id tạm của liên hệ này */
  const TEMP_ID = Date.now().toString()

  // thêm liên hệ vào danh sách liên hệ
  $props.source?.push({
    _id: TEMP_ID,
    contact_type: $props.type,
    contact_value: '',
  })

  // lưu lại id tạm vào danh sách liên hệ cần tạo
  conversationStore.is_edit_client.contact_create[TEMP_ID] = 1
}
/**
 * Xóa một bản ghi liên hệ khỏi danh sách
 * Để người dùng có thể loại bỏ các thông tin liên lạc không chính xác hoặc không cần thiết
 */
async function removeContact(id: string) {
  if (isContactEditDisabled.value) return

  // cảnh báo trước khi xoá
  if (
    !(await confirmSync(
      'warning',
      $t('v1.view.main.dashboard.chat.client.confirm_remove_contact')
    ))
  )
    return

  // xoá khỏi giao diện
  remove($props.source || [], contact => contact?._id === id)

  // thêm vào danh sách liên hệ cần xoá
  conversationStore.is_edit_client.contact_remove[id] = 1
}
/**có hiển thị list không */
function isVisible(): boolean {
  // luôn hiển thị khi ở chế độ chỉnh sửa
  if (conversationStore.is_edit_info) return true

  // không hiển thị nếu không có dữ liệu
  return !!$props.source?.filter(item => item.contact_type === $props.type)
    .length
}
</script>
