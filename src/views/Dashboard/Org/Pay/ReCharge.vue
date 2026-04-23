<template>
  <button
    @click="$router.back()"
    class="flex gap-2.5 items-center w-fit"
  >
    <BackIcon class="w-5 h-5" />
    <span class="text-sm font-medium">
      {{ $t('v1.common.back') }}
    </span>
  </button>
  <CardItem>
    <template #icon>
      <WalletIcon class="w-5 h-5" />
    </template>
    <template #title>
      {{ $t('v1.view.main.dashboard.org.recharge') }}
    </template>
    <template #item>
      <div class="py-3">
        <div
          class="py-1 px-0 md:px-5 flex flex-col gap-3 rounded-lg border border-gray-200"
        >
          <div class="grid grid-cols-2 gap-3 max-sm:block">
            <div>
              <div class="p-4 font-medium">
                {{ $t('v1.view.main.dashboard.org.pay.recharge.amount') }}
              </div>
              <div class="p-4 pt-0 flex flex-col gap-2">
                <Cleave
                  v-if="pay_step === 'STEP_1'"
                  v-model="amount"
                  :options="{
                    numeral: true,
                    numeralThousandsGroupStyle: 'thousand',
                    delimiter: '.',
                    numeralDecimalMark: ',',
                    numeralIntegerScale: 9,
                  }"
                  class="focus:outline-orange-500 py-2 px-3 rounded-md border w-full"
                />
                <div
                  v-else
                  class="py-2 px-3 rounded-md border w-full"
                >
                  {{ currency(txn_info?.txn_origin_amount || 0) }}
                </div>
                <div class="text-sm text-slate-500">
                  {{
                    $t(
                      'v1.view.main.dashboard.org.pay.recharge.amount_description'
                    )
                  }}
                </div>
                <div
                  v-if="verify_voucher?.is_verify || txn_info?.txn_voucher_id"
                  class="text-sm font-semibold text-green-600"
                >
                  <template v-if="verify_voucher?.is_verify">
                    <template
                      v-if="amount === String(verify_voucher?.txn_amount)"
                    >
                      {{
                        $t(
                          'v1.view.main.dashboard.org.pay.recharge.voucher.origin_amount'
                        )
                      }}
                      {{ currency(verify_voucher?.txn_origin_amount) }}
                    </template>
                    <template
                      v-if="
                        amount === String(verify_voucher?.txn_origin_amount)
                      "
                    >
                      {{
                        $t(
                          'v1.view.main.dashboard.org.pay.recharge.voucher.amount'
                        )
                      }}
                      {{ currency(verify_voucher?.txn_amount) }}
                    </template>
                  </template>
                  <template v-else>
                    <template
                      v-if="
                        txn_info?.txn_voucher_info?.voucher_effect ===
                        'DECREASE'
                      "
                    >
                      {{
                        $t(
                          'v1.view.main.dashboard.org.pay.recharge.voucher.origin_amount'
                        )
                      }}
                      {{ currency(txn_info.txn_amount) }}
                    </template>
                    <template v-else>
                      {{
                        $t(
                          'v1.view.main.dashboard.org.pay.recharge.voucher.amount'
                        )
                      }}
                      {{
                        currency(
                          sum([
                            txn_info?.txn_amount,
                            txn_info?.txn_credit_amount,
                          ])
                        )
                      }}
                    </template>
                  </template>
                </div>
              </div>
            </div>
            <div>
              <div class="p-4 font-medium">
                {{
                  $t('v1.view.main.dashboard.org.pay.recharge.voucher.title')
                }}
              </div>
              <div class="p-4 pt-0 flex flex-col gap-2">
                <input
                  v-if="pay_step === 'STEP_1'"
                  v-model="voucher_code"
                  @keyup="debounceVerifyVoucher"
                  class="focus:outline-orange-500 py-2 px-3 rounded-md border w-full"
                  :placeholder="
                    $t(
                      'v1.view.main.dashboard.org.pay.recharge.voucher.description'
                    )
                  "
                />
                <div
                  v-else
                  class="py-2 px-3 rounded-md border w-full"
                >
                  <span v-if="voucher_code">{{ voucher_code }}</span>
                  <span
                    v-else
                    class="text-slate-500"
                  >
                    {{
                      $t(
                        'v1.view.main.dashboard.org.pay.recharge.voucher.empty'
                      )
                    }}
                  </span>
                </div>
                <div
                  v-if="verify_voucher?.is_verify === false"
                  class="text-sm text-red-500"
                >
                  {{
                    $t('v1.view.main.dashboard.org.pay.recharge.voucher.wrong')
                  }}
                </div>
                <div
                  v-else
                  class="text-sm text-green-600"
                >
                  {{
                    verify_voucher?.voucher_description ||
                    txn_info?.txn_voucher_info?.voucher_description
                  }}
                </div>
              </div>
            </div>
          </div>
          <hr />
          <div>
            <div class="p-4 font-medium">
              {{ $t('v1.view.main.dashboard.org.pay.recharge.invoice') }}
            </div>
            <div class="p-4 pt-0 flex flex-col gap-5">
              <div class="flex gap-5 flex-col md:flex-row">
                <Radio
                  v-model="is_issue_invoice"
                  :value="false"
                  :title="
                    $t('v1.view.main.dashboard.org.pay.recharge.no_invoice')
                  "
                  :disabled="pay_step === 'STEP_2'"
                />
                <Radio
                  v-model="is_issue_invoice"
                  :value="true"
                  :title="
                    $t('v1.view.main.dashboard.org.pay.recharge.need_invoice')
                  "
                  :disabled="pay_step === 'STEP_2'"
                />
              </div>
              <!-- <div
                v-if="is_issue_invoice"
                class="flex flex-col gap-1 text-sm"
              >
                <div class="font-semibold">
                  {{
                    $t(
                      'v1.view.main.dashboard.org.pay.recharge.invoice_info.title'
                    )
                  }}
                </div>
                <div class="font-semibold">
                  {{
                    orgStore.selected_org_info?.org_info?.org_company_name ||
                    orgStore.selected_org_info?.org_info?.org_name
                  }}
                  <template
                    v-if="orgStore.selected_org_info?.org_info?.org_tax_code"
                  >
                    -
                    {{
                      $t(
                        'v1.view.main.dashboard.org.pay.recharge.invoice_info.tax_code'
                      )
                    }}
                    :
                    {{ orgStore.selected_org_info?.org_info?.org_tax_code }}
                  </template>
                </div>
                <div class="flex">
                  <div class="w-32">
                    {{
                      $t(
                        'v1.view.main.dashboard.org.setting.customer_info.address'
                      )
                    }}:
                  </div>
                  <div>
                    {{ orgStore.selected_org_info?.org_info?.org_address }}
                  </div>
                </div>
                <div class="flex">
                  <div class="w-32">
                    {{
                      $t(
                        'v1.view.main.dashboard.org.setting.customer_info.representative'
                      )
                    }}:
                  </div>
                  <div>
                    {{
                      orgStore.selected_org_info?.org_info?.org_representative
                    }}
                  </div>
                </div>
                <div class="flex">
                  <div class="w-32">
                    {{
                      $t(
                        'v1.view.main.dashboard.org.setting.customer_info.phone'
                      )
                    }}:
                  </div>
                  <div>
                    {{ orgStore.selected_org_info?.org_info?.org_phone }}
                  </div>
                </div>
                <div class="flex">
                  <div class="w-32">
                    {{
                      $t(
                        'v1.view.main.dashboard.org.setting.customer_info.email'
                      )
                    }}:
                  </div>
                  <div>
                    {{ orgStore.selected_org_info?.org_info?.org_email }}
                  </div>
                </div>
              </div> -->

              <div
                v-if="is_issue_invoice"
                class="flex flex-col gap-1 text-sm"
              >
                <!-- Header + nút -->
                <div class="flex justify-between items-center">
                  <div class="font-semibold">
                    {{
                      $t(
                        'v1.view.main.dashboard.org.pay.recharge.invoice_info.title'
                      )
                    }}
                  </div>
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
                      <span class="hidden md:block">{{
                        $t('v1.common.ok')
                      }}</span>
                      <span class="block md:hidden">✔︎</span>
                    </button>
                    <button
                      @click="$main.cancelEdit"
                      class="bg-gray-600 text-white py-1 px-4 rounded-md text-sm font-medium"
                    >
                      <span class="hidden md:block">{{
                        $t('v1.common.cancel')
                      }}</span>
                      <span class="block md:hidden">✕</span>
                    </button>
                  </div>
                </div>

                <!-- VIEW MODE -->
                <template v-if="!is_edit">
                  <div class="font-semibold">
                    {{ org_info.org_company_name || org_info.org_name }}
                    <template v-if="org_info.org_tax_code">
                      -
                      {{
                        $t(
                          'v1.view.main.dashboard.org.pay.recharge.invoice_info.tax_code'
                        )
                      }}:
                      {{ org_info.org_tax_code }}
                    </template>
                  </div>
                  <div class="flex">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.address'
                        )
                      }}:
                    </div>
                    <div>{{ org_info.org_address }}</div>
                  </div>
                  <div class="flex">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.representative'
                        )
                      }}:
                    </div>
                    <div>{{ org_info.org_representative }}</div>
                  </div>
                  <div class="flex">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.phone'
                        )
                      }}:
                    </div>
                    <div>{{ org_info.org_phone }}</div>
                  </div>
                  <div class="flex">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.email'
                        )
                      }}:
                    </div>
                    <div>{{ org_info.org_email }}</div>
                  </div>
                </template>

                <!-- EDIT MODE -->
                <template v-else>
                  <div class="flex items-center">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.company_name'
                        )
                      }}:
                    </div>
                    <input
                      disabled
                      v-model="org_info.org_company_name"
                      class="border p-1 rounded w-full"
                    />
                  </div>
                  <div class="flex items-center">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.tax_code'
                        )
                      }}:
                    </div>
                    <input
                      v-model="org_info.org_tax_code"
                      class="border p-1 rounded w-full"
                    />
                  </div>
                  <div class="flex items-center">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.address'
                        )
                      }}:
                    </div>
                    <input
                      v-model="org_info.org_address"
                      class="border p-1 rounded w-full"
                    />
                  </div>
                  <div class="flex items-center">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.representative'
                        )
                      }}:
                    </div>
                    <input
                      v-model="org_info.org_representative"
                      class="border p-1 rounded w-full"
                    />
                  </div>
                  <div class="flex items-center">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.phone'
                        )
                      }}:
                    </div>
                    <input
                      v-model="org_info.org_phone"
                      class="border p-1 rounded w-full"
                    />
                  </div>
                  <div class="flex items-center">
                    <div class="w-32">
                      {{
                        $t(
                          'v1.view.main.dashboard.org.setting.customer_info.email'
                        )
                      }}:
                    </div>
                    <input
                      v-model="org_info.org_email"
                      class="border p-1 rounded w-full"
                    />
                  </div>
                </template>
              </div>

              <ul
                v-if="is_issue_invoice"
                class="list-disc list-inside text-xs text-slate-500"
              >
                <li class="pl-4 -indent-4">
                  {{
                    $t(
                      'v1.view.main.dashboard.org.setting.customer_info.guild_1',
                      {
                        partner: commonStore.partner?.name,
                      }
                    )
                  }}
                </li>
                <li class="pl-4 -indent-4">
                  {{
                    $t(
                      'v1.view.main.dashboard.org.setting.customer_info.guild_2',
                      {
                        partner: commonStore.partner?.name,
                      }
                    )
                  }}
                  hotro@botbanhang.vn
                </li>
              </ul>
            </div>
            <hr />
          </div>
          <div>
            <div class="p-4 font-medium">
              {{ $t('v1.view.main.dashboard.org.pay.recharge.pay') }}
            </div>
            <div class="p-4 pt-0 flex flex-col gap-5">
              <template v-for="method of LIST_PAYMENT_METHOD">
                <Radio
                  v-if="
                    pay_step === 'STEP_1' ||
                    (pay_step === 'STEP_2' && payment_method === method.value)
                  "
                  v-model="payment_method"
                  :value="method.value"
                  :title="method.title"
                  :disabled="method.disabled"
                  :class="{
                    '!cursor-not-allowed': method.disabled,
                  }"
                />
              </template>
              <template v-if="pay_step === 'STEP_2'">
                <template v-if="payment_method === 'TRANSFER'">
                  <TransferInfo
                    v-model="txn_info"
                    v-model:check_payment="check_payment"
                    :amount="calcBankAmount()"
                    :txn_id="txn_info?.txn_id"
                    :is_issue_invoice
                    :is_pay_partner="
                      verify_voucher?.voucher_is_pay_partner ||
                      txn_info?.txn_voucher_info?.voucher_is_pay_partner
                    "
                    :partner_info="
                      verify_voucher?.voucher_partner_info ||
                      txn_info?.txn_voucher_info?.voucher_partner_info
                    "
                    :wallet_balance="wallet_balance.toString()"
                  />
                  <!-- <button
                    v-if="txn_info?.txn_status !== 'SUCCESS'"
                    @click="checkPayment"
                    class="py-2 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:brightness-90 w-fit uppercase"
                  >
                    {{
                      $t(
                        'v1.view.main.dashboard.org.pay.recharge.transfer_info.check'
                      )
                    }}
                  </button> -->
                </template>
                <template v-else> Tính năng đang phát triển! </template>
              </template>
              <button
                v-if="pay_step === 'STEP_1'"
                @click="createTxn"
                class="py-2 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:brightness-90 w-fit"
              >
                {{ $t('v1.view.main.dashboard.org.pay.recharge.continue') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </CardItem>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-in-out duration-300"
      leave-active-class="transition ease-in-out duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="is_success_open"
        class="fixed top-0 left-0 w-screen h-screen py-10 bg-black/30 z-40 flex items-center justify-center"
      >
        <div
          class="bg-white rounded-lg shadow-lg p-6 w-[500px] text-center flex flex-col gap-4 animate-in fade-in"
          @click.stop
        >
          <div class="flex flex-col items-center gap-3">
            <!-- Icon success -->
            <svg
              class="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2l4-4m5 2a9 9 0 1 1-18 0a9 9 0 0 1 18 0z"
              />
            </svg>
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
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Cleave from 'vue-cleave-component'
import { useCommonStore, useOrgStore } from '@/stores'
import { toast, toastError } from '@/service/helper/alert'
import {
  create_txn,
  read_txn,
  read_wallet,
  update_org,
} from '@/service/api/chatbox/billing'
import { useRoute, useRouter } from 'vue-router'
import { copy, currency } from '@/service/helper/format'

import CardItem from '@/components/Main/Dashboard/CardItem.vue'
import Radio from '@/views/Dashboard/Org/Pay/ReCharge/Radio.vue'
// import TransferInfo from '@/views/Dashboard/Org/Pay/ReCharge/TransferInfo.vue'

import TransferInfo from '@/views/Dashboard/Org/Pay/PackInfo/TransferInfo.vue'

import BackIcon from '@/components/Icons/Back.vue'
import WalletIcon from '@/components/Icons/Wallet.vue'

import type {
  ITxnMeta,
  OrgInfo,
  TransactionInfo,
} from '@/service/interface/app/billing'
import {
  BillingAppVoucher,
  type ResponseVerifyVoucher,
} from '@/utils/api/Billing'
import { debounce, set, size, sum } from 'lodash'
import { loading } from '@/utils/decorator/Loading'
import { error } from '@/utils/decorator/Error'
import { container } from 'tsyringe'
import { Toast } from '@/utils/helper/Alert/Toast'
import type { QuotaType } from '@/service/interface/app/ai'

const { t: $t } = useI18n()
const orgStore = useOrgStore()
const $router = useRouter()
const $route = useRoute()
const commonStore = useCommonStore()

/**các phương thức thanh toán */
const LIST_PAYMENT_METHOD: {
  title: string
  value: TransactionInfo['txn_payment_method']
  disabled?: boolean
}[] = [
  {
    title: $t('v1.view.main.dashboard.org.pay.recharge.transfer'),
    value: 'TRANSFER',
  },
  // {
  //   title: $t('v1.view.main.dashboard.org.pay.recharge.vnpay'),
  //   value: 'VNPAY',
  //   disabled: true,
  // },
  // {
  //   title: $t('v1.view.main.dashboard.org.pay.recharge.zalopay'),
  //   value: 'ZALO_PAY',
  //   disabled: true,
  // },
  // {
  //   title: $t('v1.view.main.dashboard.org.pay.recharge.momo'),
  //   value: 'MOMO',
  //   disabled: true,
  // },
  // {
  //   title: $t('v1.view.main.dashboard.org.pay.recharge.card'),
  //   value: 'CARD',
  //   disabled: true,
  // },
]
/**bước thanh toán */
const pay_step = ref<'STEP_1' | 'STEP_2'>('STEP_1')
/**id giao dịch đang chọn để xem */
const selected_txn_id = ref<string>($route.query.txn_id as string)
/**số tiền nạp */
// const amount = ref<string>('500000')
const amount = ref<string>('500000')

/** Số tiền sau khi giảm giá */
const wallet_balance = ref<number>(0)
/**mã giảm giá */
const voucher_code = ref<string>()
/**có xuất hoá đơn không */
const is_issue_invoice = ref<boolean>(false)
/**phương thức thanh toán đang chọn */
const payment_method = ref<TransactionInfo['txn_payment_method']>('TRANSFER')
/**thông tin giao dịch mới tạo */
const txn_info = ref<TransactionInfo>()

/** Check trạng thái payment */
const check_payment = ref(false)

/** trạng thái payment modal */
const is_success_open = ref(false)
/**dữ liệu xác thực mã khuyến mại */
const verify_voucher = ref<ResponseVerifyVoucher>({})

/** Theo dõi trạng thái payment */
watch(check_payment, value => {
  if (value) {
    /** Bật modal báo success */
    is_success_open.value = true
    setTimeout(() => {
      /** sau 5s thì tắt */
      is_success_open.value = false
      /** Back về màn trước đó */
      $router.back()
    }, 3000)
  }
})

// khởi tạo dữ liệu của giao dịch đã chọn nếu có
onMounted(initSelectedTxn)

/**tính ra số tiền chính xác cần quét qr */
function calcBankAmount(): string {
  // nếu không có mã giảm giá thì thôi
  if (!size(verify_voucher.value)) return amount.value

  /**số tiền mới */
  const NEW_AMOUNT = String(verify_voucher.value?.txn_origin_amount)

  // nếu tăng thì giữ nguyên số tiền
  if (amount.value == NEW_AMOUNT) return amount.value
  // nếu giảm thì lấy số tiền gốc mới
  else return NEW_AMOUNT
}
/**khởi tạo dữ liệu của giao dịch đã chọn */
async function initSelectedTxn() {
  // nếu không có txn_id thì thôi
  if (!selected_txn_id.value || !orgStore.selected_org_id) return

  // kích hoạt trạng thái loading
  orgStore.is_loading = true

  try {
    // chuyển sang bước 2
    pay_step.value = 'STEP_2'

    /**kết quả trả về */
    const RES = await read_txn(orgStore.selected_org_id, selected_txn_id.value)

    // nếu không tìm thấy giao dịch thì thôi
    if (!RES?.[0]) throw 'NOT_FOUND'

    // lưu thông tin giao dịch
    txn_info.value = RES?.[0]

    // đánh dấu có xuất hoá đơn hay không
    is_issue_invoice.value = txn_info.value.txn_is_issue_invoice || false

    // lấy thông tin phương thức thanh toán
    payment_method.value = txn_info.value.txn_payment_method

    // lấy số tiền
    amount.value = String(txn_info.value.txn_amount)

    // lấy mã khuyến mãi
    voucher_code.value = txn_info.value.txn_voucher_info?.voucher_code
  } catch (e) {
    // hiển thị thông báo lỗi
    toastError(e)
  }

  // kích hoạt trạng thái loading
  orgStore.is_loading = false
}

/** Khai báo meta cho việc tự động mua gói */
const meta = ref<ITxnMeta>({
  type: 'TOP_UP_WALLET', // giá trị mặc định
})
/**tạo mới giao dịch */
async function createTxn() {
  /** nếu chưa chọn tổ chức nào thì không thực hiện */
  if (
    !orgStore.selected_org_id ||
    orgStore.is_loading ||
    verify_voucher.value?.is_verify === false
  )
    return

  /** kích hoạt trạng thái loading */
  orgStore.is_loading = true

  try {
    /**số tiền nạp */
    const AMOUNT = Number(amount.value)
    // const AMOUNT = 4000
    // kiểm tra số tiền nạp có hợp lệ không
    if (!AMOUNT || AMOUNT < 50000 || AMOUNT > 250000000)
      // if (!AMOUNT || AMOUNT > 250000000)
      throw $t('v1.view.main.dashboard.org.pay.recharge.amount_description')

    /**lấy thông tin ví hiện tại */
    const WALLET_INFO = await read_wallet(orgStore.selected_org_id)

    /** Lưu số dư ví */
    wallet_balance.value = WALLET_INFO.wallet_balance || 0

    /**id ví */
    const WALLET_ID = WALLET_INFO?.wallet_id

    // kiểm tra ví có tồn tại không
    if (!WALLET_ID)
      throw $t('v1.view.main.dashboard.org.pay.recharge.wrong_wallet_id')

    // tạo giao dịch
    txn_info.value = await create_txn(
      orgStore.selected_org_id,
      WALLET_ID,
      AMOUNT,
      payment_method.value,
      is_issue_invoice.value,
      voucher_code.value,
      meta.value
    )

    // chuyển sang bước 2
    pay_step.value = 'STEP_2'
  } catch (e) {
    // hiển thị thông báo lỗi
    toastError(e)
  }

  // tắt trạng thái loading
  orgStore.is_loading = false
}
/**kiểm tra trạng thái thanh toán đã thành công chưa */
async function checkPayment() {
  // nếu chưa chọn tổ chức nào thì không thực hiện
  if (
    !orgStore.selected_org_id ||
    !txn_info.value?.txn_id ||
    orgStore.is_loading
  )
    return

  // kích hoạt trạng thái loading
  orgStore.is_loading = true

  try {
    /**kết quả trả về */
    const RES = await read_txn(orgStore.selected_org_id, txn_info.value?.txn_id)

    // nếu giao dịch chưa được xác minh thì thôi
    if (RES?.[0]?.txn_status !== 'SUCCESS') throw 'NOT_SUCCESS'

    // thông báo thành công
    toast('success', $t('v1.view.main.dashboard.org.pay.recharge.success'))

    // quay về trang chính
    $router.push('/dashboard/org/pay/info')
  } catch (e) {
    // nếu giao dịch chưa thành công
    if (e === 'NOT_SUCCESS')
      toast(
        'warning',
        $t('v1.view.main.dashboard.org.pay.recharge.not_success')
      )
    // hiển thị thông báo lỗi
    else toastError(e)
  }

  // tắt trạng thái loading
  orgStore.is_loading = false
}
/**kiểm tra mã giảm giá */
const debounceVerifyVoucher = debounce(verifyVoucher, 300)
/**kiểm tra mã giảm giá */
async function verifyVoucher() {
  try {
    // nếu không có mã giảm giá thì thôi
    if (!voucher_code.value) {
      // xoá mã thì đánh dấu là hợp lệ
      verify_voucher.value = {}

      return
    }

    // kích hoạt trạng thái loading
    orgStore.is_loading = true

    /**kết quả trả về */
    verify_voucher.value = await new BillingAppVoucher().verifyVoucher(
      Number(amount.value),
      voucher_code.value
    )
  } catch (e) {
  } finally {
    // tắt trạng thái loading
    orgStore.is_loading = false
  }
}
/** Khai báo toast */
const $toast = container.resolve(Toast)

/**có kích hoat chế độ sửa không */
const is_edit = ref(false)
/**dữ liệu trước khi sửa */
const old_info = ref<OrgInfo['org_info']>({})
/** Hàm theo dõi thông tin org */
const org_info = computed({
  get() {
    return orgStore.selected_org_info?.org_info || {}
  },
  set(val) {
    set(orgStore, 'selected_org_info.org_info', val)
  },
})
/** Hàm main */
class Main {
  activeEdit() {
    old_info.value = copy(org_info.value)
    is_edit.value = true
  }
  cancelEdit() {
    if (orgStore.is_loading) return
    org_info.value = copy(old_info.value || {})
    is_edit.value = false
  }
  @loading(toRef(orgStore, 'is_loading'))
  @error($toast)
  async save() {
    if (!orgStore.selected_org_id) return
    await update_org(orgStore.selected_org_id, { org_info: org_info.value })
    is_edit.value = false
    $toast.success($t('v1.common.update_success'))
  }
}
const $main = new Main()
</script>
