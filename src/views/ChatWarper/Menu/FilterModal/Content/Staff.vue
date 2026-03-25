<template>
  <MenuTitle :title="$t('v1.view.main.dashboard.chat.filter.staff.title')" />
  <div class="py-3">
    <input
      ref="search_ref"
      type="text"
      :placeholder="$t('v1.view.main.dashboard.chat.filter.staff.find_staff')"
      class="border px-3 py-1 w-full rounded-lg focus:outline-none text-sm"
      v-on:keyup="searchStaff"
      v-model.trim="search_staff_name"
    />
  </div>
  <div class="h-[calc(100%_-_88px)] overflow-y-auto">
    <div
      class="w-full flex items-center justify-between py-2.5 border-b cursor-pointer hover:bg-orange-100 px-2"
      v-for="(staff, index) in staff_list"
      @click="selectStaff(index)"
    >
      <div class="flex items-center">
        <StaffAvatar
          class="rounded-full w-6 h-6 mr-3"
          :id="staff?.user_id || staff?.fb_staff_id"
        />
        <p
          :class="{
            'line-through': !staff?.user_id,
          }"
          class="text-sm"
        >
          {{ staff.name }}
        </p>
      </div>
      <img
        v-if="staff.is_selected"
        class="w-5 h-5"
        src="@/assets/icons/check-circle.svg"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { nonAccentVn } from '@/service/helper/format'
import { useConversationStore } from '@/stores'
import { debounce, map, size, sortBy } from 'lodash'
import { ref } from 'vue'

import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'
import MenuTitle from '@/components/Main/Dashboard/MenuTitle.vue'

import type { StaffInfo } from '@/service/interface/app/staff'
import type { ComponentRef } from '@/service/interface/vue'

const conversationStore = useConversationStore()

/** Danh sách nhân viên */
const staff_list = defineModel<StaffInfo[]>('staff_list', {
  default: [],
  required: true,
})
/** Danh sách nhân viên */
const snap_staffs = defineModel<{ [index: string]: StaffInfo }>('snap_staffs', {
  default: {},
  required: true,
})
/** Search staff name */
const search_staff_name = ref<string>('')
/**ref của dropdown search */
const search_ref = ref<ComponentRef>()

/** Lựa chọn nhân viên */
function selectStaff(index: number) {
  // toggle nhãn
  staff_list.value[index].is_selected = !staff_list.value[index].is_selected

  /**danh sách id nhãn đã chọn */
  let list_id = staff_list.value
    ?.filter(staff => staff.is_selected)
    ?.map(staff => staff.user_id || staff.fb_staff_id)

  // lưu lại id nhãn đã chọn vào store
  conversationStore.option_filter_page_data.staff_id = size(list_id)
    ? list_id
    : undefined

  // sort đã chọn lên đầu
  staff_list.value = sortStaff(staff_list.value)
}
/**đưa các staff được chọn lên đầu */
function sortStaff(input: StaffInfo[]) {
  return sortBy(input, 'is_selected').reverse()
}
/** Lọc hội thoại theo nhân viên */
const searchStaff = debounce(($event: Event) => {
  // nếu không tìm kiếm thì hiển thị toàn bộ
  if (!search_staff_name.value)
    return (staff_list.value = sortStaff(map(snap_staffs.value)))

  // lọc các nhãn thoả mãn tìm kiếm
  let temp: StaffInfo[] = map(snap_staffs.value).filter((item: StaffInfo) =>
    nonAccentVn(item.name).includes(nonAccentVn(search_staff_name.value))
  )

  staff_list.value = sortStaff(temp)
}, 300)
</script>
