<template>
  <div class="h-[calc(100%_-_33px)] overflow-y-auto">
    <div
      class="w-full flex items-center justify-between py-2.5 border-b cursor-pointer hover:bg-orange-100 px-2"
      v-for="(staff, staff_id) of staffs"
      @click="$emit('select_staff', staff)"
      v-show="staff"
    >
      <div class="flex items-center">
        <StaffAvatar
          class="rounded-full mr-3 w-9 h-9"
          :id="staff?.user_id || staff?.fb_staff_id"
        />
        <p
          :class="{
            'line-through': !staff?.user_id,
          }"
          class="text-sm"
        >
          {{ staff?.name }}
        </p>
      </div>
      <img
        v-if="select_staff_id === (staff.user_id || staff.fb_staff_id)"
        class="w-5 h-5"
        src="@/assets/icons/check-circle.svg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'

import type { StaffInfo } from '@/service/interface/app/staff'

const $emit = defineEmits(['select_staff'])

const $props = withDefaults(
  defineProps<{
    /** Danh sách nhân viên */
    staffs: StaffInfo[]
    /** Nhân viên được phân công phụ trách cuộc hội thoại */
    select_staff_id: string
  }>(),
  {}
)
</script>
