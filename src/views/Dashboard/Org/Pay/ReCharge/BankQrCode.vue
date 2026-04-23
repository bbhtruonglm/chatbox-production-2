<template>
  <div class="w-full h-full flex justify-center items-center relative">
    <Loading v-if="is_loading" />
    <template v-else-if="qr_code_content">
      <VueQrcode
        :value="qr_code_content"
        :options="{ margin: 0, errorCorrectionLevel: 'H' }"
        tag="img"
        class="w-44 h-44"
        :class="{'blur-sm': IS_TXN_STATUS}"
      />
      <div
        class="w-11 h-11 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white flex justify-center items-center rounded border-2"
      >
        <img
          src="@/assets/icons/bbh-mini.svg"
          class="w-full h-full"
        />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { qr_code } from '@/service/api/chatbox/billing'
import { toastError } from '@/service/helper/alert'
import { useOrgStore } from '@/stores'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import VueQrcode from '@chenfengyuan/vue-qrcode'
import Loading from '@/components/Loading.vue'


const route = useRoute()

const TXN_STATUS_SUCCESS = 'SUCCESS'

// lấy query txn_status để check xem có phải đi từ xem lịch sử giao dịch không để làm mờ QR code
const IS_TXN_STATUS = route.query.txn_status === TXN_STATUS_SUCCESS

const $props = withDefaults(
  defineProps<{
    /**mã BIN của ngân hàng */
    bank_bin?: number
    /**số tài khoản người nhận */
    consumer_id?: string
    /**số tiền chuyển khoản */
    amount?: string
    /**nội dung chuyển khoản */
    message?: string
    /**trạng thái giao dịch */
    txn_status?: string
  }>(),
  {}
)

const orgStore = useOrgStore()
// const commonStore = useCommonStore()

/**có đang loading không */
const is_loading = ref<boolean>(false)
/**nội dung của QR code */
const qr_code_content = ref<string>()
// khi có thay đổi thì sẽ tạo lại mã QR
// onMounted(createQrCodeContent)
// watch(() => $props.bank_bin, createQrCodeContent)
// watch(() => $props.consumer_id, createQrCodeContent)
// watch(() => $props.amount, createQrCodeContent)
// watch(() => $props.message, createQrCodeContent)

// /**tạo ra nội dung của mã QR */
// async function createQrCodeContent() {
//   console.log('createQrCodeContent', $props)
//   // nếu thiếu thông tin thì thôi
//   if (
//     !$props.bank_bin ||
//     !$props.consumer_id ||
//     !$props.amount ||
//     !$props.message ||
//     !orgStore.selected_org_id
//   )
//     return

//   // kích hoạt loading
//   is_loading.value = true

//   console.log('createQrCodeContent - start')
//   console.log('org_id', orgStore.selected_org_id)
//   console.log('bank_bin', $props.bank_bin)
//   console.log('consumer_id', $props.consumer_id)
//   console.log('amount', Number($props.amount))
//   console.log('message', $props.message)

//   try {
//     // lấy nội dung mã QR
//     qr_code_content.value = await qr_code({
//       org_id: orgStore.selected_org_id,
//       bank_bin: $props.bank_bin,
//       consumer_id: $props.consumer_id,
//       amount: Number($props.amount),
//       message: $props.message,
//       version: 'v2',
//       txn_id: $props.message,
//     })
//   } catch (e) {
//     // báo lỗi nếu có
//     toastError(e)
//   }

//   // tắt loading
//   is_loading.value = false
// }
onMounted(createQrCodeContent)
watch(() => $props.bank_bin, createQrCodeContent)
watch(() => $props.consumer_id, createQrCodeContent)
watch(() => $props.amount, createQrCodeContent)
watch(() => $props.message, createQrCodeContent)

/**tạo ra nội dung của mã QR */
async function createQrCodeContent() {
  // nếu thiếu thông tin thì thôi
  if (
    !$props.bank_bin ||
    !$props.consumer_id ||
    !$props.amount ||
    !$props.message ||
    !orgStore.selected_org_id
  )
    return

  // kích hoạt loading
  is_loading.value = true

  try {
    // lấy nội dung mã QR
    qr_code_content.value = await qr_code({
      org_id: orgStore.selected_org_id,
      bank_bin: $props.bank_bin,
      consumer_id: String($props.consumer_id),
      amount: Number($props.amount),
      message: $props.message,
      // version: 'v2',
      txn_id: $props.message,
    })
  } catch (e) {
    // báo lỗi nếu có
    toastError(e)
  }

   // tắt loading
  is_loading.value = false
}
  /** debounce để tránh gọi nhiều lần khi props đổi liên tục */
  // const createQrCodeContentDebounced = debounce(createQrCodeContent, 300)

  /** khi mounted thì gọi lần đầu */
  // onMounted(createQrCodeContent)

  /** gộp watchers lại thành 1 */
  // watch(
  //   () => [$props.bank_bin, $props.consumer_id, $props.amount, $props.message],
  //   createQrCodeContentDebounced
  // )
</script>