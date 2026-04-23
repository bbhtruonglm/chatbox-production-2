<template>
    <Modal ref="modal_ref">
        <template v-slot:body>
            <div class="flex flex-col md:flex-row h-[70vh] overflow-y-auto md:h-full">
                <div class="flex flex-col items-center p-5">
                    <StaffAvatar class="rounded-full w-20 h-20" :id="chatbotUserStore.getStaffId()" />
                    <p class="text-lg font-bold mt-1">{{ chatbotUserStore.chatbot_user?.full_name }}</p>
                    <p class="mt-5 text-center whitespace-nowrap text-slate-600">
                        {{ $t('v1.view.main.dashboard.chat.facebook_errors.190.need_account') }} 
                    </p>
                    <p class="mb-8 text-slate-600">
                        <strong>
                            {{ chatbotUserStore.chatbot_user?.full_name }}
                        </strong>
                        {{ $t('v1.view.main.dashboard.chat.facebook_errors.190.get_permission') }}
                    </p>
                    <Facebook 
                        class="w-fit h-[40px]" border_radius="20px" @access_token="syncFacebookPage"
                        :text="$t('v1.view.main.dashboard.chat.facebook_errors.190.continue_with_facebook')" 
                    />
                    <p class="mt-5 text-base text-slate-600">{{ $t('v1.view.main.dashboard.chat.facebook_errors.190.or') }}</p>
                    <p @click="signout" class="mt-5 underline text-slate-800 cursor-pointer hover:text-blue-500">{{ $t('v1.view.main.dashboard.chat.facebook_errors.190.login_with_another_account') }}</p>
                </div>
                <div v-if="error" class="flex flex-col items-center sm:w-[480px] w-full mt-3">
                    <p class="text-xl font-bold mb-6">{{ $t('v1.view.main.dashboard.chat.facebook_errors.190.facebook_permission') }}</p>

                    <p class="mb-6">{{ $t('v1.view.main.dashboard.chat.facebook_errors.190.session_expired') }}</p>

                    <p class="mb-7">
                        <span v-html="$t('v1.view.main.dashboard.chat.facebook_errors.190.continue_get_permission')"></span>
                        <strong>
                            {{  pageStore.selected_page_list_info[
                                    conversationStore.select_conversation?.fb_page_id as string
                                ].page?.name 
                            }}
                        </strong>
                    </p>

                    <div class="flex items-start w-full mb-1">
                        <p class="text-slate-600">
                            {{ $t('v1.view.main.dashboard.chat.facebook_errors.190.error_content') }}
                        </p>
                    </div>

                    <div class="rounded-lg bg-gray-300 p-3 w-full break-words h-[170px] overflow-y-auto">
                        {{ $props.error }}
                    </div>

                </div>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
// * Libraries
import { ref } from 'vue';
import { useI18n } from 'vue-i18n'

// * Store
import {
    useChatbotUserStore, 
    useConversationStore, 
    usePageStore 
} from '@/stores'

// * Service
import { flow } from '@/service/helper/async'
import { toast } from '@/service/helper/alert';
import { signout } from '@/service/helper/oauth'
import { sync_facebook_page } from '@/service/api/chatbox/n4-service'

// * Component
import Modal from '@/components/Modal.vue'
import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'
import Facebook from '@/components/OAuth/Facebook.vue'

// * Interface
import type { ComponentRef } from '@/service/interface/vue'
import type { CbError } from '@/service/interface/function'


const $props = withDefaults(defineProps<{
    error?: {
        code?: number
        message?: string
    }
}>(), {})

const $t = useI18n().t
const pageStore = usePageStore()
const chatbotUserStore = useChatbotUserStore()
const conversationStore = useConversationStore()

/** Ref của modal */
const modal_ref = ref<ComponentRef>()

/** Dùng để bật tắt modal */
function toggleModal() {
    modal_ref.value?.toggleModal()
}
/**đồng bộ dữ liệu page mới nhất từ fb */
function syncFacebookPage(access_token: string) {
    flow([
        // * call api đồng bộ page từ fb
        (cb: CbError) => sync_facebook_page(access_token, undefined,(e, r) => {
            if (e) return cb(e)
            toggleModal()
            toast('success',  $t('v1.view.main.dashboard.user.re_granted_successfully'))
            cb()
        })
    ], undefined, true)
}

defineExpose({ toggleModal })
</script>
