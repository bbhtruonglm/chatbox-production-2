  <template>
    <MenuTitle :title="$t('v1.view.main.dashboard.header.business')" />
    <MenuItem
      @click="redirectMenu('org')"
      :icon="BriefCaseIcon"
      :title="$t('v1.view.main.dashboard.header.menu.setting_business')"
    />
    <MenuItem
      @click="redirectMenu('org')"
      :icon="UsersIcon"
      :title="$t('v1.view.main.dashboard.header.menu.staff_manager')"
    />
    <MenuItem
      v-if="IS_SHOW_PAYMENT"
      @click="redirectMenu('org/pay')"
      :icon="CheckBadgeIcon"
      :title="$t('v1.view.main.dashboard.header.menu.pricing_manager')"
    ></MenuItem>
    <MenuItem
      @click="redirectMenu('widget')"
      :icon="SquareIcon"
      :title="$t('v1.view.main.dashboard.nav.widget')"
    />
  </template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import BriefCaseIcon from '@/components/Icons/BriefCase.vue'
import CheckBadgeIcon from '@/components/Icons/CheckBadge.vue'
import SquareIcon from '@/components/Icons/Square.vue'
import UsersIcon from '@/components/Icons/Users.vue'
import MenuItem from '@/components/Main/Dashboard/MenuItem.vue'
import MenuTitle from '@/components/Main/Dashboard/MenuTitle.vue'

const { t: $t } = useI18n()
const $router = useRouter()

/** hiển thị thanh toán */
const IS_SHOW_PAYMENT = $env.is_show_payment

const $emit = defineEmits(['close'])

/**mở menu */
function redirectMenu(path: string) {
  // chuyển đến trang
  $router.push(`/dashboard/${path}`)

  // emit sự kiện đóng dropdown ra ngoài
  $emit('close')
}
</script>
