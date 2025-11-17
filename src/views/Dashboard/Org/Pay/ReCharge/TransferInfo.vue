<template>
  <div
    class="rounded-lg w-[674px] border border-slate-300 grid grid-cols-2 overflow-hidden text-sm"
  >
    <div
      class="bg-slate-200 p-5 flex flex-col gap-2.5 border-r border-slate-300"
    >
      <div>
        <div class="text-slate-700">
          {{
            $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.account')
          }}:
        </div>
        <div class="flex gap-3 items-center">
          <div
            class="border border-green-800 bg-green-50 py-2 px-3 rounded-lg font-semibold w-fit"
          >
            {{ payment_info?.account }}
          </div>
          <div
            @click="copyToClipboard(String(payment_info?.account))"
            class="text-blue-700 cursor-copy"
          >
            {{ $t('v1.common.copy') }}
          </div>
        </div>
      </div>
      <div v-if="txn_id">
        <div class="text-slate-700">
          {{
            $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.content')
          }}:
        </div>
        <div class="flex gap-3 items-center">
          <div
            class="border border-green-800 bg-green-50 py-2 px-3 rounded-lg font-semibold w-fit"
          >
            {{ txn_id }}
          </div>
          <div
            @click="copyToClipboard(txn_id)"
            class="text-blue-700 cursor-copy"
          >
            {{ $t('v1.common.copy') }}
          </div>
        </div>
      </div>
      <div>
        <div class="text-slate-700">
          {{
            $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.name')
          }}:
        </div>
        <div
          class="border border-green-800 bg-green-50 py-2 px-3 rounded-lg font-semibold w-fit"
        >
          {{ payment_info?.name }}
        </div>
      </div>
      <div>
        <div class="text-slate-700">
          {{
            $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.bank')
          }}:
        </div>
        <div class="font-medium">
          {{ payment_info?.bank }}
        </div>
      </div>
    </div>
    <div class="p-5 flex flex-col gap-2.5 items-center">
      <div>
        {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.qr') }}
      </div>
      <BankQrCode
        :bank_bin="payment_info?.bank_bin"
        :consumer_id="payment_info?.account"
        :amount
        :message="txn_id"
      />
    </div>
  </div>
  <div class="text-slate-700">
    <div>
      {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.guild_1') }}
    </div>
    <div>
      {{
        $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.guild_2', {
          partner: commonStore.partner?.name,
        })
      }}
    </div>
  </div>
  <a
    v-if="txn_info?.txn_status === 'PENDING'"
    :href="BBH_PAGE_MESS"
    target="_blank"
    class="text-white bg-blue-600 w-fit py-2 px-4 rounded-md"
  >
    {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.support') }}
  </a>
  <div
    v-else
    class="text-green-600 bg-green-100 w-fit py-2 px-4 rounded-md"
  >
    {{ $t('v1.view.main.dashboard.org.pay.recharge.success') }}
  </div>
  <div class="text-sm py-3 px-5 rounded-lg bg-yellow-50 w-[572px]">
    <div class="font-semibold">
      {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.hint') }}:
    </div>
    <ul class="list-disc list-inside">
      <li class="pl-3">
        {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.hint_1') }}
        <a
          href="javascript:;"
          class="underline"
          >{{
            $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.here')
          }}</a
        >
      </li>
      <li class="pl-3">
        {{
          $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.hint_2', {
            partner: commonStore.partner?.name,
          })
        }}
      </li>
      <li class="pl-3">
        {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.hint_3') }}
      </li>
      <li class="pl-3">
        {{ $t('v1.view.main.dashboard.org.pay.recharge.transfer_info.hint_4') }}
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { BBH_PAGE_MESS } from '@/configs/constants/botbanhang'
import { copyToClipboard } from '@/service/helper/copyWithAlert'
import { BillingAppTxn } from '@/utils/api/Billing'
import BankQrCode from '@/views/Dashboard/Org/Pay/ReCharge/BankQrCode.vue'
import type {
  PaymentInfo,
  TransactionInfo,
} from '@/service/interface/app/billing'
import { size } from 'lodash'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useCommonStore } from '@/stores'
import type { IBankAccount } from '@/utils/api/N4Service/Partner'

const $props = withDefaults(
  defineProps<{
    /**id giao dịch */
    txn_id?: string
    /**dữ liệu giao dịch */
    // txn_info?: TransactionInfo
    /**số tiền */
    amount?: string
    /**có xuất hóa đơn không */
    is_issue_invoice?: boolean
    /**có chuyển tiền về đối tác không */
    is_pay_partner?: boolean
    /**thông tin của đối tác */
    partner_info?: IBankAccount
  }>(),
  {}
)

const commonStore = useCommonStore()

const txn_info = defineModel<TransactionInfo>()

const check_payment = defineModel<Boolean>('check_payment')

/**Thông tin chuyển khoản của cty */
const BBH: IBankAccount = {
  bank_bin: 970407,
  account: '19036252323010',
  name: 'CTCP Công nghệ Chatbot Việt Nam',
  bank: 'Ngân hàng TMCP Kỹ thương Việt Nam(Techcombank) CN Hà thành',
  code: 'BBH_TCB',
}
const A_TUNG_TIMO: IBankAccount = {
  bank_bin: 963388,
  account: '9021103769279',
  name: 'Nguyễn Đình Tùng',
  bank: 'Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)',
  code: 'TUNG_TIMO',
}

/**Thông tin chuyển khoản */
const payment_info = ref<IBankAccount>()
/**id của time out check giao dịch */
const check_txn_timeout_id = ref<number>()

// tính toán thông tin chuyển khoản khi khởi tạo
onMounted(() => {
  payment_info.value = calcPaymentInfo()

  // kiểm tra giao dịch đã thành công chưa
  checkTxnSuccess()
})

// xoá time out check giao dịch
onUnmounted(() => clearInterval(check_txn_timeout_id.value))

// tính toán thông tin chuyển khoản khi có thay đổi mã
watch(
  () => $props.txn_id,
  () => {
    payment_info.value = calcPaymentInfo()

    // kiểm tra giao dịch đã thành công chưa
    checkTxnSuccess()
  }
)

/**kiẻm tra xem giao dich đã thành công chưa */
function checkTxnSuccess() {
  // chỉ kiểm tra giao dịch mới tạo
  if (txn_info.value?.txn_status !== 'PENDING') return

  /**bước nhảy */
  // const TIMER = 1000 * 20 // 20s 1 lần
  const TIMER = 1000 * 5 // 20s 1 lần

  // kiểm tra giao dịch liên tục, sau 20s sẽ chạy lần đầu tiên
  check_txn_timeout_id.value = setInterval(async () => {
    try {
      // nếu không có id giao dịch thì dừng
      if (!txn_info.value?.txn_id || !txn_info.value?.txn_amount) throw 'NO_TXN'

      /**thời gian tạo giao dịch */
      const CREATED_AT = new Date(txn_info.value?.createdAt || 0).getTime()
      /**thời gian kiểm tra tối đa */
      const MAX_CHECK_TIME = 1000 * 60 * 30 // 30 phút

      // nếu quá thời gian kiểm tra thì dừng
      if (Date.now() - CREATED_AT > MAX_CHECK_TIME) throw 'MAX_CHECK_TIME'

      /**dữ liệu giao dịch */
      const TXN = await new BillingAppTxn().checkTxn(
        txn_info.value?.txn_id,
        payment_info.value?.code || '',
        'v2'
      )

      // nếu không có giao dịch thì check lại sau
      if (!TXN) return

      // cập nhật thông tin giao dịch
      // txn_info.value = TXN
      // txn_info.value = true

      check_payment.value = true
    } catch (e) {
      clearInterval(check_txn_timeout_id.value)
    }
  }, TIMER)
}
/**Tính toán thông tin chuyển khoản */
function calcPaymentInfo(): IBankAccount {
  /**xuất hóa đơn */
  const INVOICE: IBankAccount =
    commonStore.partner?.bank_account?.invoice || BBH
  /**không xuất hóa đơn */
  const NON_INVOICE: IBankAccount =
    commonStore.partner?.bank_account?.non_invoice || A_TUNG_TIMO

  // nếu không có mã, hoặc mã không bật chế độ đối tác, thì chuyển về cty
  if (!$props?.is_pay_partner) return INVOICE

  // nếu xuất hoá đơn thì vẫn chuyển về cty
  if ($props?.is_issue_invoice) return INVOICE

  // nếu không có thông tin đối tác thì chuyển về a Tùng
  if (!size($props?.partner_info)) return NON_INVOICE

  // nếu có thông tin đối tác thì chuyển về đối tác
  return $props.partner_info || NON_INVOICE
}
</script>
