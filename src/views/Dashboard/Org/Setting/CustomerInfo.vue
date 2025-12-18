<template>
  <CardItem>
    <template #icon>
      <BriefCaseIcon class="w-5 h-5" />
    </template>
    <template #title>
      {{ $t('v1.view.main.dashboard.org.setting.customer_info.title') }}
    </template>
    <template #action>
      <button
        v-if="!is_edit"
        @click="$main.activeEdit"
        class="bg-blue-600 text-white py-1 px-4 rounded-md text-sm font-medium"
      >
        {{ $t('v1.common.change') }}
      </button>
      <div
        v-else
        class="flex gap-2"
      >
        <button
          v-if="!orgStore.is_loading"
          @click="$main.save"
          class="bg-green-600 text-white py-1 px-4 rounded-md text-sm font-medium"
        >
          <span class="hidden md:block">{{ $t('v1.common.ok') }}</span>
          <span class="block md:hidden">✔︎</span>
        </button>
        <button
          @click="$main.cancelEdit"
          class="bg-gray-600 text-white py-1 px-4 rounded-md text-sm font-medium"
        >
          <span class="hidden md:block">{{ $t('v1.common.cancel') }}</span>
          <span class="block md:hidden">✕</span>
        </button>
      </div>
    </template>
    <template #item>
      <div
        class="grid grid-cols-1 md:grid-cols-2 text-sm font-medium gap-2 pr-5"
      >
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.org_name')
          "
          v-model="org_info.org_name"
          :is_edit
        />
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.org_avatar')
          "
          v-model="org_info.org_avatar"
          :is_edit
        >
          <img
            v-if="!is_edit"
            :src="org_info.org_avatar || commonStore.partner?.logo?.icon"
            class="w-5 h-5"
          />
          <span
            v-else-if="orgStore.isFreePack() || orgStore.isTrialPack()"
            class="text-red-500"
          >
            {{
              $t(
                'v1.view.main.dashboard.org.setting.customer_info.require_upgrade'
              )
            }}
          </span>
          <AvatarUpload
            v-else
            @upload="file => $main.uploadOrgAvatar(file)"
            v-model="org_info.org_avatar"
            :default="commonStore.partner?.logo?.icon"
            class="h-5"
          />
        </Item>
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.customer_code')
          "
          v-model="org_info.org_customer_code"
          :is_edit="false"
        />
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.contract_code')
          "
          v-model="org_info.org_contract_code"
          :is_edit="false"
        />
        <Item
          :title="$t('Id tổ chức')"
          v-model="org_id"
          :is_edit="false"
        />
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.company_name')
          "
          v-model="org_info.org_company_name"
          :is_edit
        />
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.tax_code')
          "
          v-model="org_info.org_tax_code"
          :is_edit
        />
        <Item
          :title="
            $t(
              'v1.view.main.dashboard.org.setting.customer_info.representative'
            )
          "
          v-model="org_info.org_representative"
          :is_edit
        />
        <Item
          :title="
            $t('v1.view.main.dashboard.org.setting.customer_info.address')
          "
          v-model="org_info.org_address"
          :is_edit
        />
        <Item
          :title="$t('v1.view.main.dashboard.org.setting.customer_info.phone')"
          v-model="org_info.org_phone"
          :is_edit
        />
        <Item
          :title="$t('v1.view.main.dashboard.org.setting.customer_info.email')"
          v-model="org_info.org_email"
          :is_edit
        />
      </div>
      <ul class="list-disc list-inside text-xs text-slate-500 pl-2.5">
        <li class="pl-4 -indent-4">
          {{
            $t('v1.view.main.dashboard.org.setting.customer_info.guild_1', {
              partner: commonStore.partner?.name,
            })
          }}
        </li>
        <li class="pl-4 -indent-4">
          {{
            $t('v1.view.main.dashboard.org.setting.customer_info.guild_2', {
              partner: commonStore.partner?.name,
            })
          }}
          {{ commonStore.partner?.support_email }}
        </li>
      </ul>
    </template>
  </CardItem>
</template>
<script setup lang="ts">
import { useCommonStore, useOrgStore } from '@/stores'
import { computed, ref, toRef } from 'vue'
import { set } from 'lodash'
import { copy } from '@/service/helper/format'
import { update_org } from '@/service/api/chatbox/billing'
import { useI18n } from 'vue-i18n'

import Item from '@/views/Dashboard/Org/Setting/CustomerInfo/Item.vue'

import CardItem from '@/components/Main/Dashboard/CardItem.vue'
import BriefCaseIcon from '@/components/Icons/BriefCase.vue'
import AvatarUpload from '@/components/Upload/AvatarUpload.vue'

import type { OrgInfo } from '@/service/interface/app/billing'
import { loading } from '@/utils/decorator/Loading'
import { container } from 'tsyringe'
import { Toast } from '@/utils/helper/Alert/Toast'
import { error } from '@/utils/decorator/Error'
import { BillingAppOrganization } from '@/utils/api/Billing'

const orgStore = useOrgStore()
const { t: $t } = useI18n()
const commonStore = useCommonStore()
const $toast = container.resolve(Toast)

/**có kích hoat chế độ sửa không */
const is_edit = ref(false)
/**dữ liệu trước khi sửa */
const old_info = ref<OrgInfo['org_info']>({})

/**thông tin của tổ chức */
const org_info = computed({
  get() {
    return orgStore.selected_org_info?.org_info || {}
  },
  set(val) {
    set(orgStore, 'selected_org_info.org_info', val)
  },
})
/**thông tin của tổ chức */
const org_id = computed({
  get() {
    return orgStore.selected_org_info?.org_id || {}
  },
  set(val) {},
})

class Main {
  /**bắt đầu chỉnh sửa nội dung */
  activeEdit() {
    // lưu lại thông tin cũ
    old_info.value = copy(org_info.value)

    // kích hoạt chế độ sửa
    is_edit.value = true
  }
  /**hủy bỏ chỉnh sửa */
  cancelEdit() {
    // nếu đang xử lý thì không cho huỷ
    if (orgStore.is_loading) return

    // khôi phục lại thông tin cũ
    org_info.value = copy(old_info.value || {})

    // tắt chế độ sửa
    is_edit.value = false
  }
  /**upload ảnh avt mới của tổ chức */
  @loading(toRef(orgStore, 'is_loading'))
  @error($toast)
  async uploadOrgAvatar(file?: File) {
    // nếu chưa chọn org thì không làm gì
    if (!orgStore.selected_org_id || !file) return

    // lấy link avt mới
    org_info.value.org_avatar =
      await new BillingAppOrganization().uploadOrgAvatar(
        orgStore.selected_org_id,
        file
      )
  }
  /**lưu lại thông tin mới */
  @loading(toRef(orgStore, 'is_loading'))
  @error($toast)
  async save() {
    // nếu chưa chọn org thì không làm gì
    if (!orgStore.selected_org_id) return

    // gửi request lên server
    await update_org(orgStore.selected_org_id, { org_info: org_info.value })

    // tắt chế độ sửa
    is_edit.value = false

    // thông báo thành công
    $toast.success($t('v1.common.update_success'))
  }
}
const $main = new Main()
</script>
