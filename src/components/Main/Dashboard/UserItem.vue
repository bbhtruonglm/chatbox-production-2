<template>
    <div :class="{
        'bg-orange-100': is_active,
        'md:justify-center': is_only_show_icon
    }" class="flex cursor-pointer items-center rounded-md hover:bg-orange-100">
        <div class="w-[40px] h-[40px] flex items-center justify-center relative">
            <!-- <img v-if="isActiveUser(chatbotUserStore.chatbot_user)" class="absolute top-[-14px] w-[17px]" src="@/assets/icons/crown.svg"> -->
            <StaffAvatar class="rounded-full w-10 h-10" :id="chatbotUserStore.getStaffId()" />
        </div>
        <div :class="is_only_show_icon ? 'md:hidden' : 'md:block'" class="ml-2">
            {{ chatbotUserStore.chatbot_user?.full_name }}
        </div>
    </div>
</template>

<script setup lang="ts">
// import { isActiveUser } from '@/service/helper/pricing'
import { useChatbotUserStore } from '@/stores'

import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'

withDefaults(defineProps<{
    /** đang chọn ? */
    is_active?: boolean
    /** chế độ thu nhỏ */
    is_only_show_icon?: boolean
}>(), {})

const chatbotUserStore = useChatbotUserStore()
</script>