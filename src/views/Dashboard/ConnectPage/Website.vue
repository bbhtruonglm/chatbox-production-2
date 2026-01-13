<template>
  <div class="w-full h-full grid grid-cols-2">
    <div class="flex flex-col items-center justify-center gap-5 p-2">
      <div class="w-full flex flex-col gap-1">
        <div class="text-sm font-medium">
          {{ $t('v1.view.main.dashboard.select_platform.website.name') }}
          <span class="text-red-600">*</span>
        </div>
        <input
          v-model="name"
          :placeholder="
            $t('v1.view.main.dashboard.select_platform.website.input')
          "
          type="text"
          class="py-2 px-3 rounded-md border focus:outline-orange-500 w-full"
        />
      </div>
      <button
        @click="$main.createWebsite"
        :class="{
          'contrast-50 cursor-not-allowed': !name,
        }"
        class="flex justify-between items-center py-2 px-4 gap-2 bg-slate-100 rounded-md hover:brightness-90 w-fit"
      >
        <WebIcon class="w-4 h-4" />
        <div class="text-slate-900 text-sm font-semibold">
          {{ $t('v1.view.main.dashboard.select_platform.website.btn_title') }}
        </div>
      </button>
    </div>
    <EmptyPage
      :icon="WebIcon"
      :guild="$t('v1.view.main.dashboard.select_platform.website.guild')"
      :description="
        $t('v1.view.main.dashboard.select_platform.website.description')
      "
    />
  </div>
  <InjectScript
    ref="inject_script_ref"
    :page_id
    @done="$main.done"
  />
  <AlertWarning ref="alert_reach_quota_page_ref" />
</template>
<script setup lang="ts">
import { inject, ref, toRef } from 'vue'
import { useCommonStore, useConnectPageStore, useOrgStore } from '@/stores'
import { isDomain } from '@/service/helper/check'
import { useI18n } from 'vue-i18n'
import { loading } from '@/utils/decorator/Loading'
import { error } from '@/utils/decorator/Error'
import { container } from 'tsyringe'
import { Toast } from '@/utils/helper/Alert/Toast'
import { N4SerivceAppPage } from '@/utils/api/N4Service/Page'
import { KEY_TOGGLE_MODAL_FUNCT } from '@/views/Dashboard/ConnectPage/symbol'

import EmptyPage from '@/views/Dashboard/ConnectPage/EmptyPage.vue'
import InjectScript from '@/views/Dashboard/ConnectPage/Website/InjectScript.vue'
import AlertWarning from '@/components/AlertModal/AlertWarning.vue'

import WebIcon from '@/components/Icons/Web.vue'
import type { IAlert } from '@/utils/helper/Alert/type'

const $emit = defineEmits(['done'])

/**ẩn hiện modal kết nối nền tảng */
const toggleModal = inject(KEY_TOGGLE_MODAL_FUNCT)

const connectPageStore = useConnectPageStore()
const commonStore = useCommonStore()
const { t: $t } = useI18n()
const $toast = container.resolve(Toast)
const orgStore = useOrgStore()

/**tên của trang web mới */
const name = ref<string>()
/**ref của modal hướng dẫn nhúng script */
const inject_script_ref = ref<InstanceType<typeof InjectScript>>()
/**ref của modal thông báo hết quota */
const alert_reach_quota_page_ref = ref<InstanceType<typeof AlertWarning>>()
/**id trang sau khi tạo */
const page_id = ref<string>()

class CustomToast extends Toast implements IAlert {
  public error(message: any): void {
    /** nếu lỗi là hết quota trang thì thông báo hết quota */
    if (message?.message === 'REACH_QUOTA.PAGE')
      return alert_reach_quota_page_ref.value?.toggleModal()

    /** thông báo lỗi */
    super.error(message)
  }
}

class Main {
  /**tạo mới page web */
  @loading(toRef(commonStore, 'is_loading_full_screen'))
  @error(new CustomToast())
  async createWebsite() {
    /** nếu chưa nhập tên thì không thực hiện */
    if (!name.value) return
    if (!orgStore.selected_org_id) return

    /** kiểm tra tên trang web có hợp lệ không */
    if (!isDomain(name.value))
      throw $t('v1.view.main.dashboard.select_platform.website.wrong_name')

    /** nếu tổ chức hiện tại đã hết quota thì cảnh báo */
    if (orgStore.isReachPageQuota())
      return alert_reach_quota_page_ref.value?.toggleModal()

    /**tạo mới page web */
    const PAGE = await new N4SerivceAppPage().createWebsite({
      name: name.value,
      org_id: orgStore.selected_org_id,
    })

    /** lưu lại id trang mới được tạo */
    page_id.value = PAGE?.fb_page_id

    /** mở modal hướng dẫn nhúng script */
    inject_script_ref.value?.toggleModal()
  }
  /**sau khi xong */
  async done() {
    /** reset lại giá trị */
    name.value = ''

    /** reset id trang */
    page_id.value = undefined

    /** quay lại page danh sách trang */
    // connectPageStore.selectMenu('PAGE')

    /** thông báo ra modal là đã xong */
    $emit('done')

    /** tắt modal kết nối nền tảng */
    await toggleModal?.()
  }
}
const $main = new Main()
</script>
