import { onMounted, onUnmounted } from 'vue'

import { Locale } from '@/utils/helper/Locale'
import { SingletonCdn } from '@/utils/helper/Cdn'
import { container } from 'tsyringe'
import { useChatbotUserStore } from '@/stores'

export function useEmbedChat() {
  const chatbotUserStore = useChatbotUserStore()

  const $locale = container.resolve(Locale)

  const $cdn = SingletonCdn.getInst()

  class Main {
    /**id của sdk */
    private readonly SCRIPT_ID = 'retion-embed-sdk'

    /**khởi tạo sdk */
    injectSdk() {
      // kiểm tra xem sdk đã được inject chưa
      if (document.getElementById(this.SCRIPT_ID)) return

      /**script của sdk */
      const SCRIPT = document.createElement('script')

      // thiết lập id
      SCRIPT.id = this.SCRIPT_ID

      // thiết lập id
      SCRIPT.src = '//chatbox-embed-sdk.botbanhang.vn/dist/sdk.min.js'

      /**script đầu tiên */
      const FIRST_SCRIPT = document.getElementsByTagName('script')?.[0]

      // nếu không có script nào thì return
      if (!FIRST_SCRIPT || !FIRST_SCRIPT.parentNode) return

      // chèn script vào trước script đầu tiên
      FIRST_SCRIPT.parentNode.insertBefore(SCRIPT, FIRST_SCRIPT)
    }
    removeSdk() {
      /**script của sdk */
      const SCRIPT = document.getElementById(this.SCRIPT_ID)

      // nếu không có script thì thôi
      if (!SCRIPT) return

      // xóa script
      SCRIPT.remove()
    }
    /**khởi tạo bong bóng chat */
    initEmbedChat($event: MessageEvent) {
      // kiểm tra xem event có phải từ sdk không
      if ($event.data?.from !== 'RETION_EMBED') return

      // kiểm tra xem event có phải là event load thành công không
      if ($event.data?.type !== 'LOADED_SUCCESS') return

      // khởi tạo bong bóng chat
      BBH?.init?.({
        // kích hoạt id trang chat
        page_id: '794843540615423',
        // thiết lập hiển thị - chưa có logic
        config: {
          locale: $locale.get(),
        },
        // cho phép gỡ lỗi
        is_debug: false,
      })
    }
    /**truyền dữ liệu cho popup */
    sendUserInfo($event: MessageEvent) {
      // kiểm tra xem event có phải từ sdk không
      if ($event.data?.from !== 'RETION_EMBED') return

      // kiểm tra xem event có phải là event đã khởi tạo thành công không
      if ($event.data?.type !== 'INIT_SUCCESS') return

      /**iframe của bong bóng chat */
      const IFRAME = document.querySelector(
        '#BBH-EMBED-IFRAME'
      ) as HTMLIFrameElement

      // gửi sự kiện để init thông tin user
      IFRAME?.contentWindow?.postMessage(
        {
          from: 'parent-app',
          user_name: chatbotUserStore.chatbot_user?.full_name,
          user_email: chatbotUserStore.chatbot_user?.email,
          client_id: chatbotUserStore.chatbot_user?.user_id,
          user_phone: '',
          client_avatar: $cdn.userAvt(chatbotUserStore.chatbot_user?.user_id),
        },
        '*'
      )
    }
  }
  const $main = new Main()

  onMounted(() => {
    // tiêm sdk vào dom
    $main.injectSdk()

    // sự kiện inject bong bóng chat
    window.addEventListener('message', $main.initEmbedChat)

    // sự kiện truyền thông tin user cho bong bóng chat
    window.addEventListener('message', $main.sendUserInfo)
  })

  onUnmounted(() => {
    // hủy sự kiện inject bong bóng chat
    window.removeEventListener('message', $main.initEmbedChat)

    // hủy sự kiện truyền thông tin user cho bong bóng chat
    window.removeEventListener('message', $main.sendUserInfo)

    // sự kiện destroy bong bóng chat
    BBH?.destroy?.()

    // sự kiện destroy sdk
    $main.removeSdk()
  })
  return {}
}
