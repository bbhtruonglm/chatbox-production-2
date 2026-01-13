<template>
  <EmptyPage
    :icon="InstagramIcon"
    :guild="
      $t('Kết nối _ với Trang _', {
        partner: commonStore.partner?.name,
        platform: $t('Instagram'),
      })
    "
    :description="
      $t(
        'Kết nối với Instagram để chat nhiều Trang tự động với AI, tối ưu chi phí Marketing  với CAPI, tự động tích hợp các ứng dụng của Doanh nghiệp.'
      )
    "
    class_guild="w-[482px]"
  >
    <template #button>
      <button
        @click="$main.oAuthByRedirect"
        class="py-2 px-4 rounded-md gap-2 flex items-center bg-slate-100 text-slate-900 text-sm font-semibold"
      >
        <InstagramIcon class="size-4" />
        <span>{{ $t('Kết nối với Instagram') }} </span>
      </button>
    </template>
  </EmptyPage>
  <AlertWarning ref="alert_reach_quota_page_ref" />
</template>
<script setup lang="ts">
import { useCommonStore, useOrgStore } from '@/stores'
import { WindowAction, type IWindowAction } from '@/utils/helper/Navigation'
import { container } from 'tsyringe'

import EmptyPage from '@/views/Dashboard/ConnectPage/EmptyPage.vue'
import AlertWarning from '@/components/AlertModal/AlertWarning.vue'

import InstagramIcon from '@/components/Icons/Instagram.vue'
import { ref } from 'vue'

const commonStore = useCommonStore()
const orgStore = useOrgStore()

/**ref của modal thông báo hết quota */
const alert_reach_quota_page_ref = ref<InstanceType<typeof AlertWarning>>()

class Main {
  /**
   * @param SERVICE_WINDOW_ACTION tiện ích thao tác với cửa sổ
   */
  constructor(
    private readonly SERVICE_WINDOW_ACTION: IWindowAction = container.resolve(
      WindowAction
    )
  ) {}
  /**cấp quyền bằng cách redirect của FB */
  async oAuthByRedirect() {
    /**  nếu đã đạt tới giới hạn trang thì báo lỗi*/
    if (orgStore.isReachPageQuota())
      return alert_reach_quota_page_ref.value?.toggleModal()

    /**app_id của IG */
    const APP_ID = $env.instagram.app_id
    /**redirect_uri của IG */
    const REDIRECT_URI = $env.instagram.redirect_uri
    /**scope của IG */
    const SCOPE = encodeURIComponent($env.instagram.scope.join(','))

    /**  redirect sang trang cấp quyền của IG*/
    this.SERVICE_WINDOW_ACTION.redirect(
      `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}`
    )
  }
}
const $main = new Main()
</script>
