<template>
  <div
    class="flex max-full mx-auto overflow-hidden gap-2.5 flex-grow h-full min-h-0"
  >
    <!-- Left panel -->
    <aside
      class="w-96 p-5 gap-10 bg-white flex flex-col justify-between flex-grow min-h-0 h-full rounded-xl"
    >
      <div class="flex flex-col gap-10">
        <div
          :style="{
            backgroundImage: `url(${commonStore.partner?.logo?.full})`,
          }"
          class="h-7 w-full bg-contain bg-no-repeat bg-left flex-shrink-0"
        />

        <div class="flex flex-col gap-3">
          <h1 class="text-5xl leading-tight font-semibold flex gap-3">
            <span class="py-2">
              <ShieldCheckIcon class="h-16 w-12" />
            </span>
            {{ $t('v1.view.onboarding.verify_your_account') }}
          </h1>
        </div>
      </div>
    </aside>

    <!-- Right panel -->
    <main
      class="flex w-full flex-grow min-h-0 h-full gap-3 px-3 py-5 rounded-xl bg-white flex-col justify-between"
    >
      <div class="flex flex-col flex-grow min-h-0 h-full gap-8">
        <!-- Step header -->
        <div class="flex flex-col justify-between gap-3">
          <div>
            <h2 class="text-4xl font-bold flex gap-2.5 items-center">
              <span>
                <ShieldCheckIconOutline class="size-8" />
              </span>
              {{ STEP_TITLE }}
            </h2>
            <p class="font-medium">{{ STEP_DESCRIPTIONS }}</p>
          </div>
        </div>

        <!-- Verification content -->
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1 max-w-2xl text-left">
            <label class="block text-gray-700 font-medium text-sm">
              {{ $t('v1.view.onboarding.phone') }}
            </label>
            <div
              class="flex border rounded-md overflow-hidden items-center border-gray-200"
            >
              <ShadcnSelectPopper2
                v-model="SELECTED_PREFIX"
                :options="PREFIXES"
                :placeholder="$t('v1.view.onboarding.select_country')"
                width="180px"
                class="rounded-none"
                :disabled="is_sending_verify_code"
              />
              <input
                ref="phone_ref"
                v-model="phone_value"
                type="text"
                :placeholder="$t('v1.view.onboarding.enter_phone')"
                class="w-full rounded-md px-3 py-2 outline-none focus:outline-none"
                :disabled="is_sending_verify_code"
              />
            </div>
            <p
              v-if="phone_value && !IS_PHONE_VALID"
              class="text-red-500 text-sm mt-1"
            >
              Số điện thoại không hợp lệ (chỉ nhập số, 8-15 chữ số)
            </p>
          </div>

          <!-- Nút verify -->
          <div
            v-if="!is_sending_verify_code"
            class="flex gap-5"
          >
            <button
              :class="[
                'px-6 py-3 flex items-center gap-1 border rounded-md font-medium ',
                phone_value.trim()
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-blue-100 text-blue-700 border-blue-300',
              ]"
              @click="handleVerify"
            >
              <ZaloIcon class="size-4" />
              {{ $t('v1.view.onboarding.verify_via_zalo') }}
            </button>
            <button
              :class="[
                'px-6 py-3 flex items-center gap-1 border  rounded-md font-medium ',
                phone_value.trim()
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-green-100 text-green-700 border-green-300',
              ]"
              @click="handleVerify"
            >
              <WhatsappIcon />
              {{ $t('v1.view.onboarding.verify_via_whatsapp') }}
            </button>
            <button
              :class="[
                'px-6 py-3 flex items-center gap-1 border rounded-md font-medium ',
                phone_value.trim()
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300',
              ]"
              @click="handleVerify"
            >
              <div
                :class="[
                  'flex justify-center items-center p-1 rounded-full ',
                  phone_value.trim()
                    ? 'bg-white text-slate-700'
                    : 'bg-slate-700 text-white',
                ]"
              >
                <ChatBubbleLeftEllipsisIcon class="size-3" />
              </div>
              {{ $t('v1.view.onboarding.verify_via_sms') }}
            </button>
          </div>

          <!-- OTP -->

          <div
            v-else
            class="flex flex-col gap-3"
          >
            <button
              v-if="is_sending_verify_code"
              class="px-5 py-2 w-60 flex justify-center border bg-slate-200 text-slate-700 hover:bg-slate-700 hover:text-white border-slate-700 items-center gap-1 rounded-md font-semibold text-sm"
              @click="changePhone"
            >
              {{ $t('v1.view.onboarding.change_phone') }}
            </button>

            <h4 class="text-sm">{{ $t('v1.view.onboarding.pin_code') }}</h4>

            <div class="flex flex-col gap-2">
              <div class="flex gap-2 items-center">
                <!-- 3 ô trái -->
                <div class="flex">
                  <input
                    v-for="(__, i) in 3"
                    :key="'left-' + i"
                    type="text"
                    maxlength="1"
                    v-model="OTP[i]"
                    @input="onInputOTP(i, $event)"
                    @keydown="onKeydownOTP(i, $event)"
                    class="size-9 text-center border"
                    :ref="el => setInputRef(el as HTMLInputElement | null, i)"
                    :class="[
                      i === 0
                        ? 'rounded-l-md'
                        : i === 2
                        ? 'rounded-r-md'
                        : 'border-x-0',
                    ]"
                  />
                </div>
                <span>-</span>
                <!-- 3 ô phải -->
                <div class="flex">
                  <input
                    v-for="(__, i) in 3"
                    :key="'right-' + i"
                    type="text"
                    maxlength="1"
                    v-model="OTP[i + 3]"
                    @input="onInputOTP(i + 3, $event)"
                    @keydown="onKeydownOTP(i + 3, $event)"
                    class="size-9 text-center border"
                    :ref="el => setInputRef(el as HTMLInputElement | null, i + 3)"
                    :class="[
                      i === 0
                        ? 'rounded-l-md'
                        : i === 2
                        ? 'rounded-r-md'
                        : 'border-x-0',
                    ]"
                  />
                </div>
              </div>
              <h4
                v-if="time_remaining"
                class="text-sm text-gray-500"
              >
                {{ $t('v1.view.onboarding.get_pin_code') }}
                (<span>{{ time_remaining }}s</span>)
              </h4>
              <a
                v-else
                target="_blank"
                class="underline text-sm"
              >
                {{ $t('v1.view.onboarding.send_code_again') }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="h-16"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCommonStore } from '@/stores'
import { ShieldCheckIcon } from '@heroicons/vue/24/solid'
import {
  ChatBubbleLeftEllipsisIcon,
  ShieldCheckIcon as ShieldCheckIconOutline,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'

import ZaloIcon from '@/components/Icons/Zalo.vue'
import WhatsappIcon from '@/components/Icons/Whatsapp.vue'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue'

import ShadcnSelectPopper from '@/components/Select/ShadcnSelectPopper.vue'
import ShadcnSelectPopper2 from '@/components/Select/ShadcnSelectPopper2.vue'
/** Hàm dịch */
const { t: $t } = useI18n()
/** Khai báo common store */
const commonStore = useCommonStore()

/** Định nghĩa props */
const props = defineProps<{
  /** Số phone */
  phone: string
  /** Bước hiện tại */
  current_step: number
  /** Tổng số bước */
  total_steps: number
  /** Tiêu đề step */
  STEP_TITLE: string
  /** Mô tả của step */
  STEP_DESCRIPTIONS: string
}>()

/** Hàm emit */
const $emit = defineEmits<{
  (e: 'update:phone', value: string): void
  (e: 'resend'): void
  (e: 'back'): void
  (e: 'verify'): void
}>()

/** Khai báo mảng refs để lưu trữ các input elements */
const inputs = ref<(HTMLInputElement | null)[]>([])

/** Khai báo OTP */
const OTP = ref<string[]>(Array(6).fill(''))

/** Trạng thái gửi verify code */
const is_sending_verify_code = ref(false)

/** Hàm để gán ref và focus vào ô đầu tiên nếu cần */
const setInputRef = (el: HTMLInputElement | null, index: number) => {
  inputs.value[index] = el
}

/** Hàm xử lý khi click nút "changePhone" để focus vào ô input đầu tiên */
const changePhone = () => {
  /** Forcus vào ô đầu tiên */
  if (inputs.value[0]) {
    inputs.value[0].focus()
  }
}

// Focus vào ô input đầu tiên khi component được mounted
// onMounted(() => {
//   console.log('first')
//   if (inputs.value[0]) {
//     inputs.value[0].focus()
//   }
// })

// Hàm xử lý input OTP
const onInputOTP = (index: number, event: Event) => {
  /** lấy value input  */
  const INPUT = event.target as HTMLInputElement
  /** Tăng giá trị index của ô input */
  if (INPUT.value && index < 5) {
    inputs.value[index + 1]?.focus()
  }
}

// Hàm xử lý keydown OTP
const onKeydownOTP = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !OTP.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

// const setInputRef = (
//   el: Element | ComponentPublicInstance | null,
//   i: number
// ) => {
//   inputs.value[i] = el as HTMLInputElement | null
// }

/** Prefix */
const PREFIXES = [
  { label: 'Việt Nam (+84)', value: '+84' },
  { label: 'US (+1)', value: '+1' },
  { label: 'UK (+44)', value: '+44' },
  // thêm nữa...
]

/** regex */
const PHONE_REGEX = /^\+?[0-9]{8,15}$/
/** CHeck valid */
const IS_PHONE_VALID = computed(() => PHONE_REGEX.test(phone_value.value))

/** mặc định VN */
const SELECTED_PREFIX = ref('+84')

/** countdown */
const time_remaining = ref(30)
/** Tạo count down interval */
let countdown_interval: number | undefined

/** OTP */
// const OTP = ref<string[]>(Array(6).fill(''))
/** Inputs */

/** Trạng thái verifying */
const is_verifying = ref(false)

/** Phone value với v-model */
const phone_value = ref(props.phone)

/** ref tới input */
const phone_ref = ref<HTMLInputElement | null>(null)
/** focus phone input */
onMounted(() => {
  nextTick(() => {
    if (phone_ref.value) phone_ref.value.focus()
  })
})

/** Đồng bộ phone prop với phone_value */
watch(phone_value, newValue => {
  $emit('update:phone', newValue)
})

/** Đồng bộ props.phone với phone_value khi props thay đổi */
watch(
  () => props.phone,
  newValue => {
    phone_value.value = newValue
  }
)
/** timeout verify sau 5s */
let verify_timeout: number | undefined
/** khi OTP thay đổi */
watch(
  OTP,
  newOTP => {
    /** Nếu không có verify_timeout thì clear */
    if (verify_timeout) clearTimeout(verify_timeout)
    /** Khai báo OTP string */
    const OTP_STRING = newOTP.join('')
    /** Check OTP === 6 và k phải string rỗng */
    if (OTP_STRING.length === 6 && OTP_STRING.trim() !== '') {
      console.log('OTP valid, starting verification timeout')
      verify_timeout = window.setTimeout(() => {
        console.log('Verifying OTP...')
        verifyOTP()
      }, 1000)
    } else {
      console.log('OTP invalid or incomplete')
    }
  },
  { deep: true }
) // Thêm deep để đảm bảo theo dõi thay đổi trong mảng

/** Giả lập verify */
const verifyOTP = () => {
  /** Bật verify */
  is_verifying.value = true
  setTimeout(() => {
    /** tắt verify */
    is_verifying.value = false
    console.log('Emitting verify event')
    /** Gọi hàm callback verify */
    $emit('verify')
  }, 1000)
}

/** Nhập input OTP
 * @param index
 * @param e event
 */
// const onInputOTP = (index: number, e: Event) => {
//   /** Lấy target */
//   const TARGET = e.target as HTMLInputElement
//   /** Chỉ cho phép số */
//   TARGET.value = TARGET.value.replace(/\D/g, '')
//   console.log(`Input OTP[${index}]:`, TARGET.value) // Debug giá trị input
//   /** nếu đã nhập thì focus ô input kế tiếp */
//   if (TARGET.value && index < inputs.value.length - 1) {
//     inputs.value[index + 1]?.focus()
//   }
// }

/** Phím Backspace lùi
 * @param index
 * @param e
 */
// const onKeydownOTP = (index: number, e: KeyboardEvent) => {
//   /** Nếu ấn backspace thì chuyển focus về ô input trước */
//   if (e.key === 'Backspace' && !OTP.value[index] && index > 0) {
//     inputs.value[index - 1]?.focus()
//   }
// }

/** khi trạng thái thay đổi */
watch(is_sending_verify_code, new_val => {
  /** Nếu có new value */
  if (new_val) {
    nextTick(() => {
      if (inputs.value[0]) {
        inputs.value[0].focus()
      }
    })
    /** tạo interval, giảm từ 30 -> 0 */
    time_remaining.value = 30
    countdown_interval = setInterval(() => {
      /** Nếu > 0 thì tiếp tục */
      if (time_remaining.value > 0) {
        /** giảm 1 giá trị */
        time_remaining.value--
      } else {
        /** clear interval */
        clearInterval(countdown_interval)
      }
    }, 1000)
  } else {
    /** clear interval */
    clearInterval(countdown_interval)
  }
})

/** clear interval */
onBeforeUnmount(() => {
  clearInterval(countdown_interval)
  if (verify_timeout) clearTimeout(verify_timeout)
})

/** Hàm gửi verify */
const handleVerify = () => {
  /** bật Check verify */
  is_sending_verify_code.value = true
}

/** đổi số điện thoại */
// const changePhone = () => {
//   console.log('changePhone called')
//   is_sending_verify_code.value = false
// }
</script>

<style scoped></style>
