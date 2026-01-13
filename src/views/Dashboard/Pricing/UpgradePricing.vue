<template>
  <Modal ref="upgrade_pricing_ref">
    <template v-slot:header>
      {{ $t('v1.view.main.dashboard.pricing.upgrade.title') }}
    </template>
    <template v-slot:body>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-2">
        <div class="grid grid-cols-3 mb-2 gap-x-2">
          <div class="text-slate-500 md:text-right">
            {{ $t('v1.view.main.dashboard.pricing.upgrade.page') }}
          </div>
          <div class="col-span-2 flex h-[fit-content]">
            <Select
              class="w-[-webkit-fill-available]"
              v-model="upgrade_pricing_data.selected_page"
              :placeholder="
                $t('v1.view.main.dashboard.pricing.create.page_description')
              "
            >
              <Option
                v-for="i of 30"
                :value="i"
              >
                {{ i }} {{ $t('v1.common.page') }}
              </Option>
            </Select>
            <img
              @click="upgrade_pricing_data.selected_page = ''"
              class="cursor-pointer"
              src="@/assets/icons/close.svg"
              width="28"
              height="28"
            />
          </div>
        </div>
        <div class="grid grid-cols-3 mb-2 gap-x-2">
          <div class="text-slate-500 md:text-right">
            {{ $t('v1.view.main.dashboard.pricing.upgrade.staff') }}
          </div>
          <div class="col-span-2 flex h-[fit-content]">
            <Select
              class="w-[-webkit-fill-available]"
              v-model="upgrade_pricing_data.selected_staff"
              :placeholder="
                $t('v1.view.main.dashboard.pricing.create.staff_description')
              "
            >
              <Option
                v-for="i of 60"
                :value="i"
              >
                {{ i }} {{ $t('v1.common.staff') }}
              </Option>
            </Select>
            <img
              @click="upgrade_pricing_data.selected_staff = ''"
              class="cursor-pointer"
              src="@/assets/icons/close.svg"
              width="28"
              height="28"
            />
          </div>
        </div>
      </div>
      <hr class="mb-2" />
      <div
        v-if="is_loading_calc_price"
        class="absolute left-[50%] translate-x-[-50%]"
      >
        <Loading class="mx-auto" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-2">
        <div
          v-if="price_of_pricing.cost_page"
          class="grid grid-cols-3 mb-2 gap-x-2"
        >
          <div class="text-slate-500 md:text-right">
            {{ $t('v1.view.main.dashboard.pricing.upgrade.page_price') }}
          </div>
          <div class="col-span-2">
            {{ currency(price_of_pricing.cost_page) }}
            {{ CURRENCY }}
          </div>
        </div>
        <div
          v-if="price_of_pricing.cost_staff"
          class="grid grid-cols-3 mb-2 gap-x-2"
        >
          <div class="text-slate-500 md:text-right">
            {{ $t('v1.view.main.dashboard.pricing.upgrade.staff_price') }}
          </div>
          <div class="col-span-2">
            {{ currency(price_of_pricing.cost_staff) }}
            {{ CURRENCY }}
          </div>
        </div>
        <div
          v-if="price_of_pricing.selected_month"
          class="grid grid-cols-3 mb-2 gap-x-2"
        >
          <div class="text-slate-500 md:text-right">
            {{ $t('v1.view.main.dashboard.pricing.upgrade.month') }}
          </div>
          <div class="font-bold text-green-500 col-span-2">
            {{ price_of_pricing.selected_month }}
            {{ $t('v1.common.month') }}
          </div>
        </div>
        <div
          v-if="price_of_pricing.payment"
          class="grid grid-cols-3 mb-2 gap-x-2"
        >
          <div class="text-slate-500 md:text-right">
            {{ $t('v1.view.main.dashboard.pricing.detail.payment') }}
          </div>
          <div class="font-bold text-red-500 col-span-2">
            {{ currency(price_of_pricing.payment) }}
            {{ CURRENCY }}
          </div>
        </div>
      </div>
      <hr
        v-if="price_of_pricing.payment"
        class="mb-2"
      />
    </template>
    <template v-slot:footer>
      <div class="flex justify-center">
        <button
          @click="upgradePricing"
          :disabled="!price_of_pricing.payment"
          :class="!price_of_pricing.payment ? 'bg-slate-500' : ''"
          class="bg-orange-500 text-white px-5 rounded-full py-1"
        >
          {{ $t('v1.view.main.dashboard.pricing.create_pricing') }}
        </button>
      </div>
    </template>
  </Modal>
</template>
<script setup lang="ts">
import { copy, currency } from '@/service/helper/format'
import { ref, watch } from 'vue'
import { flow } from '@/service/helper/async'
import {
  calc_price_of_upgrade_pricing,
  upgrade_this_pricing,
} from '@/service/api/chatbox/n4-service'
import { toast } from '@/service/helper/alert'
import { useI18n } from 'vue-i18n'

import Select from '@/components/Select.vue'
import Option from '@/components/Option.vue'
import Modal from '@/components/Modal.vue'
import Loading from '@/components/Loading.vue'

import type { CbError } from '@/service/interface/function'
import type { UpgradePricing } from '@/service/interface/app/pricing'
import type { ComponentRef } from '@/service/interface/vue'

const $emit = defineEmits(['done_upgrade_pricing'])

const $props = withDefaults(
  defineProps<{
    /**id của gói cần nâng cấp */
    pricing_id?: string
  }>(),
  {}
)

const { t: $t } = useI18n()

/**đơn vị tiền tệ được sử dụng */
const CURRENCY = 'VND'
/**ước lượng chi phí của gói */
const PRICE_ROOT = {
  payment: 0,
  cost_staff: 0,
  cost_page: 0,
  selected_month: 0,
}
/**data để upgrade gói */
const upgrade_pricing_data = ref<UpgradePricing>({
  pricing_id: '',
  selected_page: '',
  selected_staff: '',
})
/**ước lượng chi phí */
const price_of_pricing = ref(copy(PRICE_ROOT))
/**ref của modal */
const upgrade_pricing_ref = ref<ComponentRef>()
/**loading */
const is_loading_calc_price = ref(false)

/**theo dõi sự thay đổi của các tuỳ chọn, để từ đó tính toán số tiền */
watch(
  () => upgrade_pricing_data,
  () => calcPriceOfPricing(),
  { deep: true }
)

/**parser number cho các dữ liệu */
function formatInputPricing() {
  if (!$props.pricing_id) return {}

  return {
    pricing_id: $props.pricing_id,
    selected_page: Number(upgrade_pricing_data.value.selected_page),
    selected_staff: Number(upgrade_pricing_data.value.selected_staff),
  }
}
/**tính toán trước số tiền phải trả của nâng cấp được chọn */
function calcPriceOfPricing() {
  // nếu thiếu cả page và staff thì không chạy tính toán
  if (
    !upgrade_pricing_data.value.selected_page &&
    !upgrade_pricing_data.value.selected_staff
  ) {
    price_of_pricing.value = copy(PRICE_ROOT)
    return
  }

  // kích hoạt loading
  is_loading_calc_price.value = true

  calc_price_of_upgrade_pricing(formatInputPricing(), (e, r) => {
    // tắt loading
    is_loading_calc_price.value = false

    // nếu không đúng thì reset ước tính
    if (e) price_of_pricing.value = copy(PRICE_ROOT)
    // nếu đúng thì ghi ước tính mới
    else price_of_pricing.value = r
  })
}
/**upgrade gói */
function upgradePricing() {
  flow(
    [
      // * gọi api upgrade gói
      (cb: CbError) =>
        upgrade_this_pricing(formatInputPricing(), (e, r) => {
          if (e) return cb(e)

          // thông báo
          toast('success', $t('v1.view.main.dashboard.pricing.upgrade.success'))

          // tắt modal tạo gói
          upgrade_pricing_ref.value.toggleModal()

          // call ra bên ngoài
          $emit('done_upgrade_pricing', r)
          cb()
        }),
    ],
    undefined,
    true
  )
}
/**mở modal */
function openUpgradePricing() {
  upgrade_pricing_ref.value.toggleModal()
}

defineExpose({ openUpgradePricing })
</script>
