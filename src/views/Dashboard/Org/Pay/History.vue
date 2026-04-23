<template>
  <CardItem
    id="org__pay__txns"
    class="h-full"
  >
    <template #icon>
      <QueueIcon class="w-5 h-5" />
    </template>
    <template #title>
      {{ $t('v1.view.main.dashboard.org.pay.history_use') }}
    </template>
    <template #item>
      <div class="flex flex-col gap-2.5 min-h-0">
        <div class="text-slate-500 text-sm font-medium">
          {{ $t('v1.view.main.dashboard.org.pay.history_use_info') }}
        </div>
        <div class="overflow-x-auto">
          <table class="text-sm min-w-[80%]">
            <thead>
              <tr class="sticky top-0 bg-white z-10 font-semibold">
                <th class="pr-2.5 fake-border-b sticky-left text-left">
                  {{ $t('v1.view.main.dashboard.org.pay.transaction_id') }}
                </th>
                <th class="pr-2.5 fake-border-b whitespace-nowrap text-left">
                  {{ $t('v1.view.main.dashboard.org.pay.txn_type.title') }}
                </th>
                <th class="px-2.5 fake-border-b whitespace-nowrap text-left">
                  {{ $t('v1.common.status') }}
                </th>
                <th class="px-2.5 fake-border-b whitespace-nowrap text-right">
                  {{ $t('v1.view.main.dashboard.org.pay.amount') }}
                </th>
                <th class="px-2.5 fake-border-b whitespace-nowrap text-left">
                  {{ $t('v1.view.main.dashboard.org.pay.date') }}
                </th>
                <th class="px-2.5 fake-border-b whitespace-nowrap text-left">
                  {{ $t('v1.view.main.dashboard.org.pay.operator') }}
                </th>
                <th class="pl-2.5 fake-border-b"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="txn of list_txn">
                <td class="pr-2.5 py-3 sticky-left text-left">
                  {{ txn.txn_id }}
                </td>
                <td class="pr-2.5 whitespace-nowrap text-left">
                  {{
                    $t(
                      `v1.view.main.dashboard.org.pay.txn_type.${txn.txn_type?.toLowerCase()}`
                    )
                  }}
                </td>
                <td
                  :class="{
                    'text-green-600': txn.txn_status === 'SUCCESS',
                    'text-yellow-600': txn.txn_status === 'PENDING',
                    'text-red-600': txn.txn_status === 'FAILED',
                  }"
                  class="px-2.5 whitespace-nowrap text-left"
                >
                  {{
                    $t(
                      `v1.view.main.dashboard.org.pay.status_list.${txn.txn_status}`
                    )
                  }}
                </td>
                <td
                  :class="{
                    'text-green-600': txn.txn_type === 'DEPOSIT',
                    'text-red-600': ['PAYMENT', 'WITHDRAW'].includes(
                      txn.txn_type || ''
                    ),
                  }"
                  class="px-2.5 whitespace-nowrap text-right"
                >
                  <span v-if="txn.txn_type !== 'DEPOSIT'">-</span>
                  <span v-else>+</span>
                  {{ $main.getTxnAmount(txn) }}
                  {{ txn?.txn_currency }}
                </td>
                <td class="px-2.5 whitespace-nowrap text-left">
                  {{ $date_handle.format(txn.createdAt, 'dd/MM/yyyy - HH:mm') }}
                </td>
                <td class="px-2.5 whitespace-nowrap text-left">
                  {{ txn.txn_data?.user_info?.full_name }}
                </td>
                <td
                  v-if="txn.txn_type === 'DEPOSIT'"
                  @click="$main.detailTxn(txn.txn_id, txn.txn_status)"
                  class="pl-2.5 text-right text-blue-700 cursor-pointer font-medium"
                >
                  {{ $t('v1.view.main.dashboard.org.pay.view') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </CardItem>
</template>
<script setup lang="ts">
import { currency } from '@/service/helper/format'
import { read_txn } from '@/service/api/chatbox/billing'
import { useOrgStore } from '@/stores'
import { onMounted, ref, toRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DateHandle } from '@/utils/helper/DateHandle'
import { container } from 'tsyringe'
import { loading } from '@/utils/decorator/Loading'
import { error } from '@/utils/decorator/Error'
import { Toast } from '@/utils/helper/Alert/Toast'

import CardItem from '@/components/Main/Dashboard/CardItem.vue'

import QueueIcon from '@/components/Icons/Queue.vue'

import type { TransactionInfo } from '@/service/interface/app/billing'
import { sum } from 'lodash'

const orgStore = useOrgStore()
const $router = useRouter()
const $date_handle = container.resolve(DateHandle)
const $toast = container.resolve(Toast)

/**danh sách giao dịch */
const list_txn = ref<TransactionInfo[]>()

class Main {
  /**chuyển đến trang chi tiết giao dịch */
  detailTxn(txn_id?: string, txn_status?: string) {
    // nếu không có txn_id thì không chuyển
    if (!txn_id) return

    // chuyển đến trang chi tiết giao dịch + query txn_id, txn_status
    $router.push({ path: '/dashboard/org/pay/recharge', query: { txn_id, txn_status } })
  }
  /**đọc danh sách giao dịch */
  @loading(toRef(orgStore, 'is_loading'), false)
  @error($toast)
  async readTxn() {
    // kiểm tra xem đã chọn org chưa
    if (!orgStore.selected_org_id) return

    // đọc danh sách giao dịch
    list_txn.value = await read_txn(orgStore.selected_org_id)
  }
  /**lấy số tiền giao dịch */
  getTxnAmount(txn: TransactionInfo) {
    /**tổng số tiền giao dịch */
    const TOTAL_AMOUNT = sum([txn.txn_amount, txn?.txn_credit_amount])

    // trả về số tiền đã định dạng
    return currency(TOTAL_AMOUNT)
  }
}
const $main = new Main()

// khi component được mount thì đọc danh sách giao dịch
onMounted($main.readTxn)
// khi chọn org khác thi đọc lại danh sách giao dịch
watch(() => orgStore.selected_org_id, $main.readTxn)
</script>
<style scoped lang="scss">
.sticky-left {
  @apply whitespace-nowrap sticky left-0 bg-white;
}

.fake-border-b {
  box-shadow: inset 0 -1px 0 0 rgba(0, 0, 0, 0.1);
  padding-bottom: 5px;
}
</style>
