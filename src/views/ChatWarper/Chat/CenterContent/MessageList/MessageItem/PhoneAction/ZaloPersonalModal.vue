<template>
  <Modal
    ref="modal_widget_ref"
    class_modal="w-[432px]"
    :class_body="`flex gap-2 ${
      view === 'SEARCH' || !view ? 'h-96' : 'h-[80dvh]'
    }`"
  >
    <template #header>
      {{
        view === 'SEARCH' ? $t('Thêm khách hàng') : $t('Hội thoại Zalo cá nhân')
      }}
    </template>
    <template #body>
      <iframe
        id="iframe-zalo"
        ref="iframe_ref"
        class="w-full rounded-xl"
        :src="url_iframe"
        frameborder="0"
      ></iframe>
    </template>
  </Modal>
</template>
<script setup lang="ts">
import { useOrgStore } from '@/stores'
import { N4SerivceAppZaloPersonal } from '@/utils/api/N4Service/ZaloPersonal'
import { container } from 'tsyringe'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getItem } from '@/service/helper/localStorage'

import Modal from '@/components/Modal.vue'

import type { MessageInfo } from '@/service/interface/app/message'

/** link gốc của chatbot */
const DOMAIN_CHATBOT = getDomain()

const $props = withDefaults(
  defineProps<{
    /**dữ liệu tin nhắn */
    message?: MessageInfo
  }>(),
  {}
)

const orgStore = useOrgStore()

/**ref của modal kết nối nền tảng */
const modal_widget_ref = ref<InstanceType<typeof Modal>>()

/** màn hiển thị */
const view = ref<'SEARCH' | 'CHAT' | 'FRIEND_REQUEST' | ''>('')

/** ref tới iframe */
const iframe_ref = ref<HTMLIFrameElement>()

/** link của url */
const url_iframe = computed(() => {
  /** kết quả */
  let result: string[] = []
  // nếu có id tổ chức
  if (orgStore.selected_org_id) {
    result.push(`org_id=${orgStore.selected_org_id}`)
  }
  // nếu có id khách hàng
  if ($props.message?.fb_client_id) {
    result.push(`actual_client_id=${$props.message?.fb_client_id}`)
  }
  // nếu có id trang
  if ($props.message?.fb_page_id) {
    result.push(`actual_page_id=${$props.message?.fb_page_id}`)
  }
  // nếu có id tin nhắn
  if ($props.message?._id) {
    result.push(`message_id=${$props.message?._id}`)
  }
  // nếu có token
  if (getItem('access_token')) {
    result.push(`token=${getItem('access_token')}`)
  }
  // nếu có số điện thoại
  if ($props.message?.client_phone) {
    result.push(`phone=${$props.message?.client_phone}`)
  }
  return `${DOMAIN_CHATBOT}/zalo-personal-conversation?${result?.join('&')}`
})

class Main {
  constructor(
    private readonly API = container.resolve(N4SerivceAppZaloPersonal)
  ) {}

  /** lấy id của khách */
  async getClientId(page_id?: string) {
    // nếu không có trang nào thì thôi
    if (!page_id || !$props.message) return

    // lấy id của khách với có số điện thoại trong tin nhắn và đã nhắn cho page
    const RES = await this.API.getClientId(page_id, $props.message?._id)

    return RES
  }

  /**ẩn hiện modal của component */
  toggleModal() {
    modal_widget_ref.value?.toggleModal()
  }

  /** hàm xử lý khi nhân được sự kiện từ iframe zalo personal core */
  async handleEvent(event: MessageEvent) {
    // nếu không phải từ zalo personal core thi thôi
    if (event.data?.from !== 'ZALO_PERSONAL_CORE') return

    // nếu là lấy id client_id
    if (event.data?.type === 'get.client_id') {
      this.hanldeGetClientId(event.data.data.page_id)
    }

    // nếu là chuyển màn
    if (event.data?.type === 'view.change') {
      // lưu lại view
      view.value = event.data.data.view
    }
  }

  /** Xử lý khi nhận được mesage với type get.client_id  */
  async hanldeGetClientId(page_id: string) {
    // id của trang cần lấy id khách hàng
    const CLIENT_ID = await $main.getClientId(page_id)

    // gửi id khách hàng vào iframe zalo personal core
    iframe_ref.value?.contentWindow?.postMessage(
      {
        type: 'get.client_id',
        from: 'ZALO_PERSONAL_CONTAINER',
        data: {
          client_id: CLIENT_ID,
        },
      },
      '*'
    )
  }
}

const $main = new Main()

/** hàm xử lý sự kiện khi nhân được từ iframe zalo personal core */
const handleMessage = $main.handleEvent.bind($main)

/** link gốc của chatbot  */
function getDomain() {
  // nếu là prod thì link gốc là https://retion.ai/chat
  if (window.location.origin === 'https://retion.ai')
    return 'https://retion.ai/chat'
  return window.location.origin
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})

// cung cấp hàm toggle modal cho component cha
defineExpose({ toggleModal: $main.toggleModal.bind($main) })
</script>
