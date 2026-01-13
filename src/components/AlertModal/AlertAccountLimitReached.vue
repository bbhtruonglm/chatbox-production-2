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
        class="absolute top-0 left-0 w-screen h-screen bg-black/10 z-20"
        @click="closeModal()"
      >
        <div
          @click.stop
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 max-w-[95%] max-h-[95%] shadow-lg w-[507px]"
        >
          <XMarkIcon
            @click="closeModal()"
            class="absolute top-5 right-5 size-5 cursor-pointer"
          />
          <div class="text-lg font-semibold">
            {{ $t('Đã đạt giới hạn gói') }}
          </div>
          <div class="text-zinc-500">
            <p class="pt-2 text-sm">
              {{
                $t(
                  'Tổ chức của bạn đã đạt đến giới hạn cho số trang hoặc số thành viên. Để tránh gián đoạn trải nghiệm dịch vụ, vui lòng nâng cấp gói. Bạn cũng có thể liên hệ với bộ phận hỗ trợ để được tư vấn thêm.'
                )
              }}
            </p>
          </div>
          <div class="flex justify-between items-center">
            <button
              v-if="orgStore.isAdminOrg()"
              class="btn-custom bg-green-100 text-green-600 mt-6"
              @click="goToPay"
            >
              {{ $t('Đi tới nâng cấp gói') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useOrgStore } from '@/stores'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const $emit = defineEmits(['close_modal'])

const orgStore = useOrgStore()

/** router */
const $router = useRouter()

/**modal xác nhận huỷ trang */
const is_open = ref(false)

/**ẩn hiện modal của component */
function toggleModal() {
  is_open.value = !is_open.value
}

/** chuyển sang màn thanh toán */
function goToPay() {
  $router.push('/dashboard/org/pay/info')
}

/**dong modal xác nhận huỷ trang */
function closeModal() {
  $router.push('/dashboard/select-page')
  toggleModal()
}

/** mở modal */
function openModal() {
  is_open.value = true
}

defineExpose({ toggleModal, openModal })
</script>
<style scoped lang="scss">
.btn-custom {
  @apply text-sm font-medium rounded-md py-2 px-4 flex items-center gap-2 hover:brightness-90;
}
</style>
