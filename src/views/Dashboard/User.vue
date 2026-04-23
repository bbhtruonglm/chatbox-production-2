<template>
    <div class="w-full h-full flex items-center flex-col pt-[65px]">
        <StaffAvatar class="rounded-full w-36 h-36" :id="chatbotUserStore.getStaffId()"  />
        <div class="mt-2 font-bold text-2xl text-slate-500">
            {{ chatbotUserStore.chatbot_user?.full_name }}
        </div>
        <div @click="copyToClipboard(chatbotUserStore.chatbot_user?.fb_staff_id || '')" class="font-medium cursor-pointer">
            {{ $t('v1.view.main.dashboard.setting.personal_setting.id') }}:
            {{ chatbotUserStore.chatbot_user?.fb_staff_id }}
        </div>
        <div class="mt-10">
            <div>
                <button @click="personal_settings_ref.toggleModal()" class="bg-green-500 hover:brightness-125 text-white font-semibold p-2 w-[300px] rounded-full">
                    {{ $t('v1.view.main.dashboard.setting.personal_setting.title') }}
                </button>
            </div>
        </div>
        <div class="mt-5">
            <div>
                <button @click="facebook_error_ref.toggleModal()" class="bg-blue-500 hover:brightness-125 text-white font-semibold p-2 w-[300px] rounded-full">
                    {{ $t('v1.view.main.dashboard.user.grant_fb_permission') }}
                </button>
            </div>
        </div>
        <!-- class="mt-10" khi nào có nhiều btn thì sẽ thêm class này -->
        <div class="mt-5">
            <button @click="signout" class="bg-red-500 hover:brightness-125 text-white font-semibold p-2 w-[300px] rounded-full">
                {{ $t('v1.view.main.dashboard.user.logout') }}
            </button>
        </div>
    </div>
    <FacebookError ref="facebook_error_ref" />
    <PersonalSetting ref="personal_settings_ref" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatbotUserStore } from '@/stores'
import { signout } from '@/service/helper/oauth'
import { copyToClipboard } from '@/service/helper/copyWithAlert'

import PersonalSetting from './Setting/PersonalSetting.vue'
import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'
import FacebookError from '@/components/Main/Dashboard/FacebookError.vue'

import type { ComponentRef } from '@/service/interface/vue'

const chatbotUserStore = useChatbotUserStore()

/**ref của component facebook error */
const facebook_error_ref = ref<ComponentRef>()
/**ref của component facebook error */
const personal_settings_ref = ref<ComponentRef>()
</script>
