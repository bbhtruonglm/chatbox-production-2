<template>
  <teleport to="body">
    <Transition name="fade">
      <div
        v-if="is_visible"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 font-sans"
        role="dialog"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-scale-in"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          >
            <h3 class="text-lg font-semibold text-gray-900">
              {{ $t('Thông báo quan trọng') }}
            </h3>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Body -->
          <div
            class="px-6 py-3 overflow-y-auto flex flex-col custom-scrollbar bg-slate-100 gap-2"
          >
            <p class="text-sm font-medium leading-relaxed">
              {{
                $t(
                  'Gói của một số Tổ chức sắp hết hạn. Bạn nên gia hạn để tiếp tục sử dụng đầy đủ tính năng và không gián đoạn dịch vụ'
                )
              }}
            </p>
            <div class="flex flex-col gap-3">
              <h4 class="font-bold text-gray-900 text-lg">
                {{ $t('Tổ chức') }}
              </h4>

              <div
                v-for="item in display_list"
                :key="item.id"
                class="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 gap-4"
              >
                <!-- Left: Info -->
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <img
                      :src="item.avatar || '/images/default-org.png'"
                      @error="
                        $event.target.src =
                          'https://ui-avatars.com/api/?name=' +
                          item.name +
                          '&background=random'
                      "
                      class="size-8 rounded-full object-cover border border-gray-200"
                      alt=""
                    />
                  </div>
                  <div>
                    <p class="text-gray-900 text-sm font-medium">
                      {{ item.name }}
                    </p>
                    <p class="text-xs text-slate-700">
                      {{ $t('Gói hiện tại') }}:
                      <span class="text-slate-700 font-medium">{{
                        item.package_name
                      }}</span>
                    </p>
                  </div>
                </div>

                <!-- Right: Status & Actions -->
                <div
                  class="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto"
                >
                  <div class="text-right">
                    <p
                      class="text-sm"
                      :class="
                        item.is_expired
                          ? 'text-red-600 font-semibold'
                          : 'text-orange-500 font-medium'
                      "
                    >
                      {{ item.status_text }}
                    </p>
                    <p class="text-xs text-slate-700 font-regular">
                      {{ $t('Ngày hết hạn') }}: {{ item.end_date }}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      @click="handleSwitchPackage(item)"
                      class="px-4 py-2 rounded-lg bg-blue-200 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      {{ $t('Đổi gói') }}
                    </button>
                    <button
                      @click="handleExtend(item)"
                      class="px-4 py-2 rounded-lg bg-blue-700 text-white font-medium text-sm hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap"
                    >
                      {{ $t('Gia hạn ngay') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="px-6 py-3 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-b-2xl"
          >
            <a
              href="#"
              @click.prevent="handleSwitchPackage"
              class="text-blue-600 font-medium text-sm flex items-center gap-2 hover:text-blue-700 transition-colors group"
            >
              {{ $t('Xem các gói') }}
              <ArrowTopRightOnSquareIcon class="size-4" />
            </a>

            <div class="flex items-center gap-6">
              <label
                class="flex items-center gap-3 cursor-pointer select-none group"
              >
                <div class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="dont_show_again"
                    class="sr-only peer"
                  />
                  <div
                    class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"
                  ></div>
                </div>
                <span
                  class="text-xs text-gray-600 font-regular group-hover:text-gray-800 transition-colors"
                  >{{ $t('Không hiện lại bảng này') }}</span
                >
              </label>

              <button
                @click="handleClose"
                class="px-4 py-2 rounded-lg bg-slate-200 font-medium text-sm hover:bg-slate-300 transition-colors shadow-sm"
              >
                {{ $t('Đóng') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useOrgStore } from '@/stores'
import {
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

/**
 * Component: VipExpireToast
 * Description: Modal thông báo các gói dịch vụ sắp hết hạn hoặc đã hết hạn.
 */

/** Hook i18n */
const { t: $t } = useI18n()
/** Store tổ chức */
const org_store = useOrgStore()
/** Router */
const router = useRouter()

/** --- State --- */
/** Trạng thái hiển thị modal */
const is_visible = ref(false)
/** Danh sách hiển thị */
const display_list = ref([])
/** Trạng thái không hiện lại */
const dont_show_again = ref(false)

/** --- Constants --- */
/** Ngưỡng ngày sắp hết hạn */
const THRESHOLD_DAYS = 7
/** Ngưỡng ngày hiển thị sau khi hết hạn */
const EXPIRED_SHOW_DAYS = 14
/** Key lưu trữ local storage */
const STORAGE_KEY_DAILY = 'vip_toast_shown_at'

/**
 * Tính toán danh sách hiển thị từ store
 * @param {Array} orgs - Danh sách tổ chức
 * @returns {Array} - Danh sách hiển thị
 */
const computeDisplayList = orgs => {
  /** Thời gian hiện tại */
  const NOW = dayjs()
  /** Thời gian sắp tới */
  const SOON = NOW.add(THRESHOLD_DAYS, 'day')
  /** Danh sách kết quả */
  const LIST = []

  /** Duyệt qua danh sách tổ chức */
  for (const org of orgs || []) {
    /** Gói dịch vụ */
    const PKG = org.org_package || {}
    /** Ngày hết hạn */
    const END = dayjs(Number(PKG.org_end_date))
    /** Ngày bắt đầu */
    const START = dayjs(Number(PKG.org_start_date))
    /** Loại gói */
    const TYPE = PKG.org_package_type

    /** Bỏ qua nếu không có ngày hết hạn hợp lệ */
    if (!END.isValid()) continue

    /** Cờ hết hạn */
    let is_expired = false
    /** Trạng thái text */
    let status_text = ''
    /** Số ngày còn lại */
    let days_left = 0

    /** Xử lý gói FREE mới hết hạn (logic cũ) */
    if (TYPE === 'FREE') {
      /** Số ngày từ khi bắt đầu */
      const DAYS_SINCE_START = NOW.diff(START, 'day')
      /** Nếu mới hết hạn trong vòng 14 ngày */
      if (DAYS_SINCE_START <= EXPIRED_SHOW_DAYS) {
        /** Đánh dấu hết hạn */
        is_expired = true
        /** Set text trạng thái */
        status_text = $t('Đã hết hạn')
        /** Thêm vào danh sách */
        LIST.push({
          id: org._id,
          name: org.org_info?.org_name || $t('Không tên'),
          avatar: org.org_info?.org_avatar,
          package_name: PKG.package_name || TYPE,
          end_date: START.format('DD/MM/YYYY'),
          is_expired,
          status_text,
          days_left: 0,
          raw_end_date: START /** dùng để sort */,
          org_info: org.org_info,
          org_id: org.org_id,
        })
      }
      /** Tiếp tục vòng lặp */
      continue
    }

    /** Xử lý gói trả phí */
    if (END.isBefore(NOW)) {
      /** Nếu đã hết hạn quá 14 ngày thì bỏ qua */
      if (NOW.diff(END, 'day') > EXPIRED_SHOW_DAYS) continue

      /** Đánh dấu hết hạn */
      is_expired = true
      /** Set text trạng thái */
      status_text = $t('Đã hết hạn')
    } else if (END.isBefore(SOON)) {
      /** Chưa hết hạn */
      is_expired = false
      /** Tính số ngày còn lại */
      days_left = END.diff(NOW, 'day')
      /** Set text trạng thái */
      status_text = $t('Còn _ ngày', { duration: days_left })
    } else {
      /** Chưa đến hạn thì bỏ qua */
      continue
    }

    /** Thêm vào danh sách */
    LIST.push({
      id: org._id,
      name: org.org_info?.org_name || $t('Không tên'),
      avatar: org.org_info?.org_avatar,
      package_name: PKG.package_name || TYPE,
      end_date: END.format('DD/MM/YYYY'),
      is_expired,
      status_text,
      days_left,
      raw_end_date: END,
      org_info: org.org_info,
      org_id: org.org_id,
    })
  }

  /** Sort: Đã hết hạn lên đầu, sau đó đến sắp hết hạn (ít ngày còn lại nhất lên trước) */
  return LIST.sort((a, b) => {
    /** Nếu a hết hạn, b chưa -> a lên trước */
    if (a.is_expired && !b.is_expired) return -1
    /** Nếu a chưa, b hết hạn -> b lên trước */
    if (!a.is_expired && b.is_expired) return 1
    /** Cùng loại thì sort theo ngày hết hạn tăng dần */
    return a.raw_end_date.diff(b.raw_end_date)
  })
}

/**
 * Kiểm tra điều kiện và hiển thị modal
 */
const maybeShow = () => {
  /** Ngày hiện tại */
  const TODAY = dayjs().format('YYYY-MM-DD')
  /** Ngày đã snooze lần cuối */
  const LAST_SNOOZED = localStorage.getItem(STORAGE_KEY_DAILY)

  /** Nếu đã snooze hôm nay thì return */
  if (LAST_SNOOZED === TODAY) return

  /** Nếu có danh sách hiển thị thì hiện modal */
  if (display_list.value.length > 0) {
    is_visible.value = true
  }
}

/**
 * Xử lý đóng modal
 */
const handleClose = () => {
  /** Ẩn modal */
  is_visible.value = false

  /** Nếu user chọn "Không hiện lại", lưu flag để ẩn trong ngày hôm nay */
  if (dont_show_again.value) {
    /** Ngày hiện tại */
    const TODAY = dayjs().format('YYYY-MM-DD')
    /** Lưu vào local storage */
    localStorage.setItem(STORAGE_KEY_DAILY, TODAY)
  }
}

/**
 * Xử lý chuyển trang đổi gói
 * @param {Object} item
 */
const handleSwitchPackage = item => {
  console.log(item, 'item item')

  /** Nếu có id thì set vào store */
  if (item.id) {
    org_store.selected_org_id = item.org_id
  }
  /** Chuyển hướng */
  router.push('/dashboard/org/pay/info')
  /** Đóng modal */
  handleClose()
}

/**
 * Xử lý gia hạn ngay
 * @param {Object} item
 */
const handleExtend = item => {
  /** Nếu có id thì set vào store */
  if (item.id) {
    org_store.selected_org_id = item.org_id
  }
  /** Chuyển hướng kèm query action */
  router.push({ path: '/dashboard/org/pay/info' })
  /** Đóng modal */
  handleClose()
}

/**
 * Xử lý xem danh sách các gói
 */
const handleViewPackages = () => {
  /** Chuyển hướng đến trang pricing */
  router.push('/dashboard/pricing')
  /** Đóng modal */
  handleClose()
}

/** --- Watchers --- */
watch(
  () => org_store.list_org,
  list => {
    /** Nếu không có list hoặc rỗng thì return */
    if (!Array.isArray(list) || !list.length) return
    /** Tính toán danh sách hiển thị */
    display_list.value = computeDisplayList(list)
    /** Kiểm tra hiển thị */
    maybeShow()
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Custom scrollbar for the list */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
