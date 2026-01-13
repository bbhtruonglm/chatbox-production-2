<template>
  <Teleport
    to="body"
    v-if="is_open"
  >
    <Transition
      enter-active-class="transition ease-in-out duration-500"
      leave-active-class="transition ease-in-out duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        class="absolute top-0 left-0 w-screen h-screen bg-black/10 z-20 shadow-lg"
      >
        <div
          @click="toggleModal"
          class="w-full h-full p-3 flex flex-grow min-h-0 overflow-y-auto justify-center items-center"
        >
          <div
            @click.stop
            class="py-3 px-6 rounded-lg bg-slate-50 max-w-full flex flex-col shadow-lg gap-10 max-h-full overflow-y-auto"
          >
            <div>
              <div class="px-3 text-lg font-semibold flex-shrink-0 text-center">
                {{ $t('v1.view.main.dashboard.org.pay.upgrade.title') }}
              </div>
              <div
                class="flex items-center justify-end w-full h-full gap-4 bg-gray-50 rounded-lg text-sm"
              >
                <span class="font-medium">{{
                  $t('v1.view.main.dashboard.org.pay.upgrade.choose_month')
                }}</span>

                <ShadcnSelectPopper
                  v-model="SELECTED"
                  :options="MONTHS"
                  placeholder="Select month"
                  width="180px"
                />
              </div>
            </div>
            <div class="grid grid-cols-4 gap-3">
              <div class="item max-w-80">
                <Content :content="CONTENTS.FREE" />
                <button
                  v-if="orgStore.isFreePack() || orgStore.isTrialPack()"
                  @click="downgradeFreePack"
                  class="btn text-slate-700 bg-slate-200 cursor-not-allowed"
                >
                  {{ $t('v1.view.main.dashboard.org.pay.upgrade.current') }}
                </button>
              </div>
              <div class="item max-w-80">
                <Content
                  :content="CONTENTS.LITE"
                  :is_full_year
                  :SELECTED
                >
                  <!-- <template #toggle>
                    <Toggle
                      v-model="is_full_year"
                      class_toggle="peer-checked:bg-black"
                    >
                      <span class="text-green-600">
                        {{ $t('v1.view.main.dashboard.org.pay.upgrade.year') }}
                      </span>
                    </Toggle>
                  </template> -->
                  <template #chat_feature>
                    (<a
                      class="underline text-blue-700"
                      href="https://retion.ai"
                      target="_blank"
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade.more')
                      }} </a
                    >)
                  </template>
                  <template #ai_feature>
                    (<a
                      class="underline text-blue-700"
                      href="https://retion.ai"
                      target="_blank"
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade.more')
                      }} </a
                    >)
                  </template>
                  <template #support>
                    (<a
                      class="underline text-blue-700"
                      href="https://bbh.gitbook.io/bot-ban-hang-docs"
                      target="_blank"
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade.more')
                      }} </a
                    >)
                  </template>
                </Content>
                <button
                  v-if="!orgStore.isBusinessPack() && !orgStore.isProPack()"
                  @click="openConfirmModal('LITE')"
                  :class="{
                    'cursor-not-allowed !text-slate-700 bg-slate-200':
                      orgStore.isLitePack(),
                  }"
                  class="btn text-white bg-green-600"
                >
                  <template v-if="orgStore.isLitePack()">
                    {{ $t('v1.view.main.dashboard.org.pay.upgrade.current') }}
                  </template>
                  <template v-else>
                    {{ $t('v1.view.main.dashboard.org.pay.upgrade.lite') }}
                  </template>
                </button>
              </div>
              <div class="item max-w-80">
                <Content
                  :content="CONTENTS.PRO"
                  :is_full_year
                  :SELECTED
                >
                  <!-- <template #toggle>
                    <Toggle
                      v-model="is_full_year"
                      class_toggle="peer-checked:bg-black"
                    >
                      <span class="text-green-600">
                        {{ $t('v1.view.main.dashboard.org.pay.upgrade.year') }}
                      </span>
                    </Toggle>
                  </template> -->
                  <template #chat_feature>
                    (<a
                      class="underline text-blue-700"
                      href="https://retion.ai"
                      target="_blank"
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade.more')
                      }} </a
                    >)
                  </template>
                  <template #ai_feature>
                    (<a
                      class="underline text-blue-700"
                      href="https://retion.ai"
                      target="_blank"
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade.more')
                      }} </a
                    >)
                  </template>
                  <template #support>
                    (<span
                      class="text-blue-700"
                      v-tooltip="
                        $t('v1.view.main.dashboard.org.pay.support_group')
                      "
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade._detail')
                      }} </span
                    >)
                  </template>
                </Content>
                <!-- @click="activeTrialOrProPack('PRO')" -->
                <button
                  v-if="!orgStore.isBusinessPack()"
                  @click="openConfirmModal('PRO')"
                  :class="{
                    'cursor-not-allowed !text-slate-700 bg-slate-200':
                      orgStore.isProPack(),
                    'bg-blue-600 text-white': !orgStore.hasTrial(),
                    'bg-green-600 text-white': orgStore.hasTrial(),
                  }"
                  class="btn"
                >
                  <template
                    v-if="
                      orgStore.isFreePack() &&
                      !orgStore.selected_org_info?.org_package?.org_has_trial
                    "
                  >
                    {{
                      $t('v1.view.main.dashboard.org.pay.upgrade.trial_day_7')
                    }}
                  </template>
                  <template v-else-if="orgStore.isProPack()">
                    {{ $t('v1.view.main.dashboard.org.pay.upgrade.current') }}
                  </template>
                  <template v-else>
                    {{ $t('v1.view.main.dashboard.org.pay.upgrade.pro') }}
                  </template>
                </button>
              </div>
              <div class="item max-w-80">
                <Content
                  :content="CONTENTS.COMPANY"
                  :is_full_year
                  :SELECTED
                >
                  <!-- <template #toggle>
                    <Toggle
                      v-model="is_full_year"
                      class_toggle="peer-checked:bg-black"
                    >
                      <span class="text-green-600">
                        {{ $t('v1.view.main.dashboard.org.pay.upgrade.year') }}
                      </span>
                    </Toggle>
                  </template> -->
                  <template #support>
                    (<span
                      class="text-blue-700"
                      v-tooltip="
                        $t('v1.view.main.dashboard.org.pay.advanced_support')
                      "
                    >
                      {{
                        $t('v1.view.main.dashboard.org.pay.upgrade._detail')
                      }} </span
                    >)
                  </template>
                </Content>
                <!-- @click="activeTrialOrProPack('BUSINESS')" -->
                <button
                  :class="{
                    'cursor-not-allowed !text-slate-700 bg-slate-200':
                      orgStore.isBusinessPack(),
                  }"
                  @click="openConfirmModal('BUSINESS')"
                  class="btn text-white bg-green-600"
                >
                  <template v-if="orgStore.isBusinessPack()">
                    {{ $t('v1.view.main.dashboard.org.pay.upgrade.current') }}
                  </template>
                  <template v-else>
                    {{ $t('v1.view.main.dashboard.org.pay.upgrade.business') }}
                  </template>
                </button>
              </div>
            </div>

            <a
              :href="`https://${commonStore.partner?.domain}/pricing`"
              target="_blank"
              class="text-slate-700 flex items-center gap-1 w-fit mx-auto"
            >
              {{ $t('v1.view.main.dashboard.org.pay.upgrade.detail') }}
              <NewTabIcon class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <AutoPaymentModal
    :is_confirm_open="is_confirm_open"
    :title="$t('v1.view.main.dashboard.org.pay.upgrade.confirm_title')"
    :selected_pack="selected_pack"
    :amount="amount"
    :wallet_balance="wallet_balance"
    @close="is_confirm_open = false"
    :SELECTED="SELECTED"
    :closeConfirmModal="closeConfirmModal"
    :MONTHS="MONTHS"
    v-model:check_payment="check_payment"
    :is_success_open="is_success_open"
    :payment_type="'PACKAGE'"
    :meta="meta"
  />
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-in-out duration-300"
      leave-active-class="transition ease-in-out duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="is_upgrade_success"
        class="fixed top-0 left-0 w-screen h-screen py-10 bg-black/30 z-40 flex items-center justify-center"
      >
        <div
          class="bg-white rounded-lg shadow-lg p-6 w-[500px] text-center flex flex-col gap-4 animate-in fade-in"
          @click.stop
        >
          <div class="flex flex-col items-center gap-3">
            <!-- Icon success -->
            <CheckCircleIcon class="size-10 text-green-600" />
            <h3 class="text-lg font-semibold text-green-600">
              {{ $t('v1.view.main.dashboard.org.pay.recharge.success') }}
            </h3>
            <p class="text-slate-600 text-sm">
              {{ $t('v1.view.main.dashboard.org.pay.recharge.success_desc') }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
import { BBH_PAGE_MESS } from '@/configs/constants/botbanhang'
import { openNewTab } from '@/service/function'
import { useCommonStore, useOrgStore } from '@/stores'
import { ref, watch } from 'vue'

// import { BBH_PAGE_MESS } from '@/service/constant/botbanhang'
import { toast, toastError } from '@/service/helper/alert'
import AutoPaymentModal from '@/views/Dashboard/Org/Pay/PackInfo/AutoPaymentModal.vue'

import { purchase_package, read_wallet } from '@/service/api/chatbox/billing'
import { useI18n } from 'vue-i18n'

import ShadcnSelectPopper from '@/components/Select/ShadcnSelectPopper.vue'

import Content from '@/views/Dashboard/Org/Pay/PackInfo/UpgradeModal/Content.vue'

import NewTabIcon from '@/components/Icons/NewTab.vue'

import { type ResponseVerifyVoucher } from '@/utils/api/Billing'
import type { IContent } from './UpgradeModal/type'

const commonStore = useCommonStore()
const orgStore = useOrgStore()
const { t: $t } = useI18n()

/** Các option chọn tháng */
const MONTHS = [
  { value: '1', label: $t('v1.view.main.dashboard.org.pay.upgrade._1_month') },
  { value: '3', label: $t('v1.view.main.dashboard.org.pay.upgrade._3_months') },
  { value: '6', label: $t('v1.view.main.dashboard.org.pay.upgrade._6_months') },
  { value: '9', label: $t('v1.view.main.dashboard.org.pay.upgrade._9_months') },
  {
    value: '12',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._12_months'),
  },
  {
    value: '15',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._15_months'),
  },
  {
    value: '18',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._18_months'),
  },
  {
    value: '21',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._21_months'),
  },
  {
    value: '24',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._24_months'),
  },
  {
    value: '27',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._27_months'),
  },
  {
    value: '30',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._30_months'),
  },
  {
    value: '33',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._33_months'),
  },
  {
    value: '36',
    label: $t('v1.view.main.dashboard.org.pay.upgrade._36_months'),
  },
]
/** giá trị mặc định */
const SELECTED = ref('12')

/**nội dung của các gói */
const CONTENTS: Record<string, IContent> = {
  /**gói miễn phí */
  FREE: {
    title: $t('v1.view.main.dashboard.org.pay.free'),
    price: $t('v1.view.main.dashboard.org.pay.free'),
    page: '1',
    member: '1',
    ai_text: '100.000 ' + $t('v1.view.main.dashboard.org.pay.text'),
    ai_image: '100 ' + $t('v1.view.main.dashboard.org.pay.image'),
    ai_sound: '100 ' + $t('v1.view.main.dashboard.org.pay.minute'),
    fau: '1.000 ' + $t('v1.view.main.dashboard.org.pay.fau'),
    client: '600',
    chat_feature: $t('v1.view.main.dashboard.org.pay.basic'),
    ai_feature: $t('v1.view.main.dashboard.org.pay.basic'),
    company_name: $t('v1.view.main.dashboard.org.pay.none'),
    api_integrate: $t('v1.view.main.dashboard.org.pay.none'),
    domain_logo: $t('v1.view.main.dashboard.org.pay.none'),
    support: $t('v1.view.main.dashboard.org.pay.not_support'),
  },
  /** gói lite */
  LITE: {
    title: $t('v1.view.main.dashboard.org.pay.lite'),
    price: '199.000 / ' + $t('v1.view.main.dashboard.org.pay.month'),
    price_year: $t('v1.view.main.dashboard.org.pay.avarage_year', {
      amount: '2.388.000',
    }),
    price_discount:
      '<span class="line-through font-normal">199.000</span> <span class="text-green-700">199.000</span> / ' +
      $t('v1.view.main.dashboard.org.pay.month'),
    price_discount_year: $t('v1.view.main.dashboard.org.pay.avarage_year', {
      amount: '2.388.000',
    }),
    page: '3',
    member: '3',
    ai_text: '1.000.000 ' + $t('v1.view.main.dashboard.org.pay.text'),
    ai_image: $t('v1.view.main.dashboard.org.pay.not_support'),
    ai_sound: $t('v1.view.main.dashboard.org.pay.not_support'),
    fau: '10.000 ' + $t('v1.view.main.dashboard.org.pay.fau'),
    client: $t('v1.view.main.dashboard.org.pay.unlimited'),
    chat_feature: $t('v1.view.main.dashboard.org.pay.all'),
    ai_feature: $t('v1.view.main.dashboard.org.pay.basic'),
    company_name: $t('v1.view.main.dashboard.org.pay.none'),
    api_integrate: $t('v1.view.main.dashboard.org.pay.none'),
    domain_logo: $t('v1.view.main.dashboard.org.pay.none'),
    support: $t('v1.view.main.dashboard.org.pay.standard'),
    note: $t('v1.view.main.dashboard.org.pay.note'),
  },
  /**gói Pro */
  PRO: {
    title: $t('v1.view.main.dashboard.org.pay.pro'),
    price: '480.000 / ' + $t('v1.view.main.dashboard.org.pay.month'),
    price_year: $t('v1.view.main.dashboard.org.pay.avarage_year', {
      amount: '5.760.000',
    }),
    price_discount:
      '<span class="line-through font-normal">480.000</span> <span class="text-green-700">288,000</span> / ' +
      $t('v1.view.main.dashboard.org.pay.month'),
    price_discount_year: $t('v1.view.main.dashboard.org.pay.avarage_year', {
      amount: '3.456.000',
    }),
    page: '5',
    member: '10',
    ai_text: '1.000.000 ' + $t('v1.view.main.dashboard.org.pay.text'),
    ai_image: '1.000 ' + $t('v1.view.main.dashboard.org.pay.image'),
    ai_sound: '1000 ' + $t('v1.view.main.dashboard.org.pay.minute'),
    fau: '10.000 ' + $t('v1.view.main.dashboard.org.pay.fau'),
    client: $t('v1.view.main.dashboard.org.pay.unlimited'),
    chat_feature: $t('v1.view.main.dashboard.org.pay.all'),
    ai_feature: $t('v1.view.main.dashboard.org.pay.all'),
    company_name: $t('v1.view.main.dashboard.org.pay.yes'),
    api_integrate: $t('v1.view.main.dashboard.org.pay.yes'),
    domain_logo: $t('v1.view.main.dashboard.org.pay.none'),
    support: $t('v1.view.main.dashboard.org.pay.prioritize'),
  },
  /**gói doanh nghiệp */
  COMPANY: {
    title: $t('v1.view.main.dashboard.org.pay.business'),
    price: '2.600.000 / ' + $t('v1.view.main.dashboard.org.pay.month'),
    price_year: $t('v1.view.main.dashboard.org.pay.avarage_year', {
      amount: '31.200.000',
    }),
    price_discount:
      '<span class="line-through font-normal">2.600.000</span> <span class="text-green-700">2.080.000</span> / ' +
      $t('v1.view.main.dashboard.org.pay.month'),
    price_discount_year: $t('v1.view.main.dashboard.org.pay.avarage_year', {
      amount: '24.960.000',
    }),
    page: '40',
    member: '40',
    ai_text: '10.000.000 ' + $t('v1.view.main.dashboard.org.pay.text'),
    ai_image: '10.000 ' + $t('v1.view.main.dashboard.org.pay.image'),
    ai_sound: '10.000 ' + $t('v1.view.main.dashboard.org.pay.minute'),
    fau: '50.000 ' + $t('v1.view.main.dashboard.org.pay.fau'),
    client: $t('v1.view.main.dashboard.org.pay.unlimited'),
    chat_feature: $t('v1.view.main.dashboard.org.pay.all'),
    ai_feature: $t('v1.view.main.dashboard.org.pay.all'),
    company_name: $t('v1.view.main.dashboard.org.pay.yes'),
    api_integrate: $t('v1.view.main.dashboard.org.pay.yes'),
    domain_logo: $t('v1.view.main.dashboard.org.pay.yes'),
    support: $t('v1.view.main.dashboard.org.pay.high'),
  },
}

/**ẩn hiện modal */
const is_open = ref(false)
/**mua gói Pro 1 năm */
const is_full_year = ref(false)
/**dữ liệu xác thực mã khuyến mại */
const verify_voucher = ref<ResponseVerifyVoucher>({})

/** gói đã chọn */
const selected_pack = ref<'LITE' | 'PRO' | 'BUSINESS' | undefined>(undefined)
/** Check trạng thái payment */
const check_payment = ref(false)
/** trạng thái payment modal */
const is_success_open = ref(false)
/** Trang thái gia hạn gói thành công */
const is_upgrade_success = ref(false)
/** Khai báo meta cho việc tự động mua gói */
const meta = ref<{
  type: 'PURCHASE' | 'INCREASE' | 'TOP_UP_WALLET'
  product: typeof selected_pack.value
}>({
  type: 'PURCHASE', // giá trị mặc định
  product: selected_pack.value,
})

/** Theo dõi trạng thái payment */
watch(check_payment, value => {
  if (value) {
    /** Bật modal báo success */
    is_success_open.value = true

    autoPayment(selected_pack.value as 'LITE' | 'PRO' | 'BUSINESS')
    // setTimeout(() => {
    //   // is_success_open.value = false
    //   /** refresh lại trang */
    //   // window.location.reload()
    //   /** sau 5s thì tắt */
    //   // is_confirm_open.value = false
    //   // is_open.value = false
    // }, 3000)
  }
})

/**mã giảm giá */
const voucher_code = ref<string>()
/** modal xác nhận thanh toán */
const is_confirm_open = ref(false)

/**số tiền nạp */
const amount = ref<string>('199000')
/** Số tiền sau khi giảm giá */
const wallet_balance = ref<number>(0)
/** Trạng thái tự động thanh toán */
const auto_payment_success = ref(false)

/** mở modal xác nhận thanh toán */
async function openConfirmModal(pack: 'LITE' | 'PRO' | 'BUSINESS') {
  /** Gọi API hoặc logic thanh toán */
  const ON_PAYMENT = await activeTrialOrProPack(pack)

  /** Nếu ví đủ tiền thì dừng, không mở modal */
  if (ON_PAYMENT !== 'WALLET.NOT_ENOUGH_MONEY') return

  /** Gán gói đã chọn */
  selected_pack.value = pack

  meta.value.product = pack

  /** Bảng giá từng gói */
  const PRICE_MAP: Record<'LITE' | 'PRO' | 'BUSINESS', number> = {
    LITE: 199000,
    PRO: 480000,
    BUSINESS: 2600000,
  }

  /** Tính tiền = đơn giá * số lượng */
  const QUANTITY = Number(SELECTED.value || 1)
  amount.value = (QUANTITY * PRICE_MAP[pack]).toString()

  /** Mở modal xác nhận */
  is_confirm_open.value = true
}

/** mở modal xác nhận thanh toán */
async function autoPayment(pack: 'LITE' | 'PRO' | 'BUSINESS') {
  /** Gọi API hoặc logic thanh toán */
  // const ON_PAYMENT = await activeTrialOrProPack(pack)

  // /** Nếu ví đủ tiền thì dừng, không mở modal */
  // if (ON_PAYMENT !== 'WALLET.NOT_ENOUGH_MONEY') {
  //   setTimeout(() => {
  //     /** reset màn hình */
  //     window.location.reload()
  //     /** sau 5s thì tắt */
  //     // is_confirm_open.value = false
  //     // is_open.value = false
  //   }, 3000)

  //   return
  // }
  /** Bật modal báo success */
  auto_payment_success.value = true
  setTimeout(() => {
    /** Tắt modal báo success */
    auto_payment_success.value = false
  }, 3000)
  /** sau 1s hiện toast */
  setTimeout(() => {
    /** thông báo mua gói thành công */
    toast('success', $t('v1.view.main.dashboard.org.pay.upgrade.success'))

    /** Tắt giao diện thanh toán */
    is_success_open.value = false
    /** Tắt modal tự động thanh toán */
    is_confirm_open.value = false
  }, 1000)
  /** sau 2s thì f5  */
  setTimeout(() => {
    /** sau 5s thì tắt  f5 màn*/
    window.location.reload()

    /** refresh lại trang */
  }, 2000)

  // /** Gán gói đã chọn */
  // selected_pack.value = pack

  // /** Bảng giá từng gói */
  // const PRICE_MAP: Record<'LITE' | 'PRO' | 'BUSINESS', number> = {
  //   LITE: 199000,
  //   PRO: 480000,
  //   BUSINESS: 2600000,
  // }

  // /** Tính tiền = đơn giá * số lượng */
  // const QUANTITY = Number(SELECTED.value || 1)
  // amount.value = (QUANTITY * PRICE_MAP[pack]).toString()

  /** Mở modal xác nhận */
  is_confirm_open.value = true
}

/** đóng modal xác nhận thanh toán */
function closeConfirmModal() {
  /** Đóng modal xác nhận */
  is_confirm_open.value = false
  /** reset thông tin gói đã chọn */
  selected_pack.value = undefined
  /** reset thông tin xác thực */
  verify_voucher.value = {}
  /** Reset thông tin mã giảm giá */
  voucher_code.value = ''
}

/**ẩn hiện modal */
function toggleModal() {
  is_open.value = !is_open.value
}
/**liên hệ với chúng tôi */
function contactUs() {
  /** nếu đang ở gói doanh nghiệp thì không mở tab */
  if (orgStore.isBusinessPack()) return

  /** mở tab liên hệ với chúng tôi */
  openNewTab(BBH_PAGE_MESS)
}
/**kích hoạt gói dùng thử hoặc gói pro */
async function activeTrialOrProPack(pack: 'LITE' | 'PRO' | 'BUSINESS') {
  /** nếu chưa chọn org thì không làm gì */
  if (!orgStore.selected_org_id || orgStore.is_loading) return

  /** nếu đã mua gói lite thì không làm gì */
  if (orgStore.isLitePack() && pack === 'LITE') return
  /** nếu đã mua gói thì không làm gì */
  if (orgStore.isProPack() && pack === 'PRO') return
  /** nếu đã mua gói doanh nghiệp thì không làm gì */
  if (orgStore.isBusinessPack() && pack === 'BUSINESS') return

  /** kích hoạt loading */
  orgStore.is_loading = true

  try {
    /**
     * tính toán gói cần mua
     * - nếu chưa mua bao giờ mà mua gói PRO, thì cho dùng thử trước
     * - nếu đã dùng thử rồi thì mua đúng
     */
    const PACKAGE = !orgStore.hasTrial() && pack === 'PRO' ? 'TRIAL' : pack

    /**dữ liệu của ví */
    const WALLET = await read_wallet(orgStore.selected_org_id)
    /** Lưu số dư ví */
    wallet_balance.value = WALLET.wallet_balance || 0

    /** nếu không có ví thì thông báo lỗi */
    if (!WALLET?.wallet_id)
      throw $t('v1.view.main.dashboard.org.pay.recharge.wrong_wallet_id')

    /**số tháng mua */
    const MONTHS = Number(SELECTED.value)

    /** yêu cầu mua gói */
    await purchase_package(
      orgStore.selected_org_id,
      WALLET?.wallet_id,
      PACKAGE,
      MONTHS
    )

    /** thông báo mua gói thành công */
    toast('success', $t('v1.view.main.dashboard.org.pay.upgrade.success'))

    /** chờ 1s */
    await new Promise(cb => setTimeout(cb, 1000))

    /** reload lại trang */
    window.location.reload()
  } catch (e) {
    if (e === 'WALLET.NOT_ENOUGH_MONEY') {
      /** Nếu Ví không đủ tiền, thì return text đó, không show toast nữa */
      return 'WALLET.NOT_ENOUGH_MONEY'
      // toastError($t('v1.view.main.dashboard.org.pay.upgrade.not_enough_money'))
    } else toastError(e)
    /** nếu có lỗi thì hiện thông báo lỗi */
  } finally {
    /** tắt loading */
    orgStore.is_loading = false
  }
}

/**hạ xuống gói free */
function downgradeFreePack() {}

defineExpose({ toggleModal })
</script>
<style scoped lang="scss">
.item {
  @apply bg-slate-100 p-2 rounded-lg flex flex-col justify-between gap-8;
}
.btn {
  @apply py-2 px-4 rounded-md hover:brightness-90 text-sm font-semibold;
}
</style>
