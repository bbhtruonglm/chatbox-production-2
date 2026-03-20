<template>
  <div
    :class="{
      '!flex': is_visible_ai_answer || is_loading,
      '!hidden':
        (!is_loading && !is_visible_ai_answer) ||
        commonStore.is_typing ||
        !conversationStore.getPage()?.quick_reply?.is_complete_sentence,
    }"
    class="hidden group-hover:flex items-center gap-2 overflow-hidden"
  >
    <button
      v-if="is_loading || !is_visible_ai_answer"
      class="rounded-full border p-1 w-fit flex-shrink-0"
    >
      <ArrowPathIcon
        :class="{
          'animate-spin': is_loading,
        }"
        class="size-4 text-blue-700"
      />
    </button>
    <button
      v-if="is_visible_ai_answer"
      @click="$main.selectAiAnswer()"
      class="border py-1 px-2 rounded-full text-xs whitespace-nowrap"
    >
      {{ ai_answer }}
    </button>
    <div class="text-slate-500 text-xxs flex-shrink-0">
      {{ $t('Ấn Tab để sử dụng') }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useCommonStore, useConversationStore, useMessageStore } from '@/stores'
import { composableService as inputComposableService } from '@/views/ChatWarper/Chat/CenterContent/InputChat/MainInput/service'

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { ArrowPathIcon } from '@heroicons/vue/24/solid'
import { debounce, last, set } from 'lodash'
import type { MessageInfo } from '@/service/interface/app/message'
import { loadingV2 } from '@/utils/decorator/Loading'
import { error } from '@/utils/decorator/Error'
import type { SourceChat } from '@/service/interface/app/ai'
import { gen_answer } from '@/service/api/chatbox/ai'
import { container, singleton } from 'tsyringe'
import { Toast } from '@/utils/helper/Alert/Toast'
import type { IAlert } from '@/utils/helper/Alert/type'
import { listenerEventBus } from '@/event'
import type { Handler } from 'mitt'

/**dữ liệu từ socket */
interface ISocketMessagePayload extends Event {
  detail?: MessageInfo
}

const conversationStore = useConversationStore()
const commonStore = useCommonStore()
const messageStore = useMessageStore()
const { InputService } = inputComposableService()

/**trạng thái loading */
const is_loading = defineModel('is_loading')

/**hội thoại hiện tại đang dược chọn */
const conversation = computed(() => conversationStore.select_conversation)
/**id của page */
const page_id = computed(() => conversation.value?.fb_page_id)
/**id của khách hàng */
const client_id = computed(() => conversation.value?.fb_client_id)
/**câu trả lời hiện tại */
const ai_answer = computed({
  get: () => conversation.value?.ai_answer,
  set: (value?: string) => {
    /** ghi đè câu trả lời vào store */
    set(conversationStore, 'select_conversation.ai_answer', value)

    set(
      conversationStore.conversation_list,
      [conversationStore.select_conversation?.data_key || '', 'ai_answer'],
      value,
    )
  },
})
/**câu trả lời tồn tại và không phải là khoảng trắng */
const is_visible_ai_answer = computed(
  () => ai_answer.value && ai_answer.value !== ' ',
)

@singleton()
class CustomToast extends Toast implements IAlert {
  public error(message: any): void {
    // TODO tạm thời chặn không báo lỗi
    return
  }
}
class Main {
  constructor(
    private readonly SERVICE_INPUT = container.resolve(InputService),
  ) {}

  /**hàm debounce để tránh spam ai quá nhiều */
  debounceGenAnswer = debounce(() => this.complete(), 1000)
  /**
   * lắng nghe dữ liệu tin nhắn để tính toán câu trả lời
   * - chỉ xử lý nếu là câu trả lời của khách hàng
   */
  onSocketMessage({ detail: message }: ISocketMessagePayload) {
    /** nếu không có dữ liệu thì thôi */
    if (!message) return

    /** nếu không phải tin nhắn của khách hàng đang chọn thì bỏ qua */
    if (client_id.value !== message.fb_client_id) return

    /** chỉ xử lý nếu là tin nhắn của khách hàng */
    if (message?.message_type !== 'client') return

    /** xử lý trường hợp khách nhắn tin dồn dập, để tránh spam ai quá nhiều */
    this.debounceGenAnswer()
  }
  /**hoàn thành câu */
  @loadingV2(is_loading, 'value')
  @error(container.resolve(CustomToast))
  async complete() {
    /** phải bật thiết lập thì mới cho chạy */
    if (!conversationStore.getPage()?.quick_reply?.is_complete_sentence) return

    /** nếu không có id của page hoặc khách hàng thì thôi */
    if (!page_id.value || !client_id.value) return

    /**input chat */
    const INPUT_CHAT = document.getElementById('chat-text-input-message')

    /** nếu không có input chat thì thôi */
    if (!INPUT_CHAT) throw 'DONE'

    /**nội dung chat */
    const SOURCE: SourceChat[] = messageStore.list_message
      ?.filter(message => message?.message_text)
      ?.filter(message => ['page', 'client'].includes(message?.message_type))
      ?.map(message => {
        return {
          type: message.message_type === 'client' ? 'CLIENT' : 'PAGE',
          content: message.message_text || '',
        }
      })

    /**nội dung chat */
    let text = INPUT_CHAT?.innerText?.trim()

    /** gọi api tạo nội dung */
    const RES = await gen_answer({
      source: SOURCE,
      /** sử dụng thủ thuật để làm ai luôn trả ra nội dung */
      current: text || '  ',
      page_id: page_id.value,
      client_id: client_id.value,
    })

    /** cập nhật câu trả lời nếu có */
    if (RES?.text) ai_answer.value = RES?.text
  }
  /**chọn câu trả lời */
  selectAiAnswer() {
    /** nếu không có câu trả lời của ai thì thôi */
    if (!conversationStore.select_conversation?.ai_answer) return

    /** ghi đè nội dung vào ô chat */
    this.SERVICE_INPUT.setInputText(
      conversationStore.select_conversation?.ai_answer,
    )

    /** xóa câu trả lời của ai hiện tại */
    conversationStore.select_conversation.ai_answer = ''
  }
}
const $main = new Main()

// /** lắng nghe sự kiện từ socket khi component được tạo ra */
// onMounted(() => {
//   /** tin nhắn mới */
//   window.addEventListener(
//     'chatbox_socket_message',
//     $main.onSocketMessage.bind($main)
//   )
// })

// /** hủy lắng nghe sự kiện từ socket khi component bị hủy */
// onUnmounted(() => {
//   /** tin nhắn mới */
//   window.removeEventListener(
//     'chatbox_socket_message',
//     $main.onSocketMessage.bind($main)
//   )
// })

// lắng nghe sự kiện từ socket
listenerEventBus(
  'chatbox_socket_message',
  $main.onSocketMessage.bind($main) as Handler<unknown>,
)

watch(
  () => messageStore.list_message,
  async (new_val, old_val) => {
    setTimeout(() => {
      /** bỏ qua nếu */
      if (
        /** danh sách tin nhắn trước đó có dữ liệu */
        old_val?.length &&
        /** là của cùng 1 hội thoại */
        last(old_val)?.fb_client_id === last(new_val)?.fb_client_id
      )
        return

      /** nếu đã có câu trả lời thì thôi */
      if (conversationStore.select_conversation?.ai_answer) return

      /** chỉ xử lý khi tin cuối cùng là của khách hàng */
      if (last(new_val)?.message_type !== 'client') return

      /** xử lý trường hợp khách nhắn tin dồn dập, để tránh spam ai quá nhiều */
      $main.debounceGenAnswer()
    }, 1000)
  },
)
</script>
