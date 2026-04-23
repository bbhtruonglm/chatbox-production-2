<template>
    <Modal ref="require_pricing_ref">
        <template v-slot:header>
            {{ $t('v1.view.main.dashboard.select_page.expire.title') }}
        </template>
        <template v-slot:body>
            <div class="text-sm text-slate-500">
                {{ $t('v1.view.main.dashboard.select_page.expire.description') }}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 mt-2 gap-4">
                <div class="flex items-center bg-slate-50 rounded-lg p-2 h-fit">
                    <div>
                        <StaffAvatar class="rounded-full w-10 h-10" :id="chatbotUserStore.getStaffId()" />
                    </div>
                    <div class="ml-2">
                        <div>
                            <span class="font-semibold text-sm">
                                {{ chatbotUserStore.chatbot_user?.full_name }}
                            </span>
                            <span class="text-sm text-slate-500 ml-1">
                                {{ chatbotUserStore.chatbot_user?.fb_staff_id }}
                            </span>
                        </div>
                        <div>
                            <span v-if="isActiveUser(chatbotUserStore.chatbot_user)" class="text-green-600 font-bold">
                                {{ $t('v1.view.main.dashboard.select_page.expire.actived') }}
                            </span>
                            <span v-else class="text-red-600 font-bold">
                                {{ $t('v1.view.main.dashboard.select_page.expire.inactive') }}
                            </span>
                        </div>
                    </div>
                </div>
                <div
                    class="grid grid-cols-1 gap-4 max-h-[calc(100vh_-_394px)] md:max-h-[calc(100vh_-_274px)] overflow-y-auto">
                    <div v-for="page of sorted_inactive_page" class="flex items-center bg-slate-50 rounded-lg p-2">
                        <div>
                            <PageAvatar class="rounded-full w-10 h-10" :page_info="page" />
                        </div>
                        <div class="ml-2 w-[calc(100%_-_48px)]">
                            <div class="truncate">
                                <span class="font-semibold text-sm">
                                    {{ page?.name }}
                                </span>
                                <span class="text-sm text-slate-500 ml-1">
                                    {{ page?.fb_page_id }}
                                </span>
                            </div>
                            <div>
                                <span v-if="isActivePage(page)" class="text-green-600 font-bold">
                                    {{ $t('v1.view.main.dashboard.select_page.expire.actived') }}
                                </span>
                                <span v-else class="text-red-600 font-bold">
                                    {{ $t('v1.view.main.dashboard.select_page.expire.inactive') }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-slot:footer>
            <div class="text-center">
                <button @click="goPricing" class="text-white bg-orange-500 px-5 py-1 rounded-full hover:bg-orange-600">
                    {{ $t('v1.view.main.dashboard.select_page.expire.go_pricing') }}
                </button>
            </div>
        </template>
    </Modal>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChatbotUserStore, useCommonStore, usePageStore } from '@/stores'
import { useRouter } from 'vue-router'
import { keys } from 'lodash'
import { isActiveUser, isActivePage } from '@/service/helper/pricing'

import Modal from '@/components/Modal.vue'
import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'
import PageAvatar from '@/components/Avatar/PageAvatar.vue'

import type { IPage, PageInfo } from '@/service/interface/app/page'
import type { ComponentRef } from '@/service/interface/vue'

const commonStore = useCommonStore()
const chatbotUserStore = useChatbotUserStore()
const pageStore = usePageStore()
const $router = useRouter()

/**ref của modal */
const require_pricing_ref = ref<ComponentRef>()
const sorted_inactive_page = ref<(IPage | undefined)[]>()

// lắng nghe sự kiện để kích hoạt modal
watch(
    () => commonStore.trigger_require_pricing,
    () => toggleRequirePricingModal()
)

/**sắp xếp lại danh sách page đang chọn */
function sortPageInactive() {
    sorted_inactive_page.value = keys(pageStore.selected_page_id_list)
        .map(page_id => pageStore.all_page_list[page_id]?.page)
        .sort((page_a, page_b) => {
            const IS_ACTIVE_PAGE_A = isActivePage(page_a)
            const IS_ACTIVE_PAGE_B = isActivePage(page_b)

            if (IS_ACTIVE_PAGE_A && IS_ACTIVE_PAGE_B) return 0

            if (IS_ACTIVE_PAGE_A) return 1

            if (IS_ACTIVE_PAGE_B) return -1

            return 0
        })
}
/**toggle modal */
function toggleRequirePricingModal() {
    // hiện modal
    require_pricing_ref.value.toggleModal()

    // sort lại danh sách page đang chọn
    sortPageInactive()
}
/**đi đến trang cài đặt gói */
function goPricing() {
    // tắt modal
    toggleRequirePricingModal()

    // đi đến trang cài đặt gói
    $router.push('/dashboard/pricing')
}
</script>
