<template>
  <div
    v-if="!select_conversation"
    class="w-full h-full flex justify-center items-center text-slate-500 gap-1"
  >
    <ChatIcon class="w-5" />
    <div>
      {{ $t('v1.view.main.dashboard.chat.empty_message') }}
    </div>
  </div>
  <div
    v-else
    id="chat__message-list"
    class="h-full overflow-hidden rounded-b-xl relative"
  >
    <!-- <SkeletonMessage
      v-if="is_loading && !messageStore.list_message?.length"
      class="absolute inset-0 z-20 bg-[#f4f5fa]"
    /> -->
    <div
      v-if="isLockPage()"
      class="text-sm text-red-600 text-center"
    >
      {{ $t('v1.view.main.dashboard.org.lock_free_page_over_quota') }}
    </div>
    <FullPost v-else-if="select_conversation.conversation_type === 'POST'" />
    <div
      v-else
      @scroll="onScrollMessage"
      :id="messageStore.list_message_id"
      class="pt-14 pb-5 pl-2 pr-5 gap-1 flex flex-col h-full overflow-hidden overflow-y-auto bg-[#0015810f] rounded-b-xl"
    >
      <!-- <div
        v-if="is_loading && messageStore.list_message?.length"
        class="flex flex-col gap-4 pt-4 pb-2 pl-2 pr-5 transition-all"
      >
        <div class="flex gap-2.5">
          <div
            class="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 animate-pulse"
          ></div>
          <div class="flex flex-col gap-1">
            <div
              class="w-[200px] h-10 bg-slate-100 rounded-lg animate-pulse"
            ></div>
          </div>
        </div>
        <div class="flex gap-2.5 flex-row-reverse">
          <div class="flex flex-col gap-1 items-end">
            <div
              class="w-[240px] h-14 bg-blue-50 rounded-lg animate-pulse"
            ></div>
          </div>
        </div>
      </div> -->
      <!-- <HeaderChat /> -->
      <div
        v-for="(message, index) of show_list_message"
        :key="message._id"
        class="relative"
      >
        <div class="flex flex-col gap-2">
          <UnReadAlert :index />
          <TimeSplit
            :before_message="show_list_message?.[index - 1]"
            :now_message="message"
          />
        </div>
        <div
          :class="{
            'py-2': ['client', 'page', 'note', 'group'].includes(
              message.message_type,
            ),
          }"
          class="flex gap-1 relative"
        >
          <div
            v-if="isClientMessage(message)"
            class="flex-shrink-0"
          >
            <ClientAvatar
              :conversation="select_conversation"
              :avatar="message?.group_client_avatar"
              class="w-8 h-8"
            />
          </div>
          <div
            :class="{
              'items-end': isFromCurrentUser(message),
            }"
            class="relative flex flex-col flex-grow min-w-0"
          >
            <MessageItem
              v-if="
                ['client', 'activity', 'page', 'note', 'group'].includes(
                  message.message_type,
                ) && !message.ad_id
              "
              :message="message"
              :message_index="index"
            />
            <div
              v-else-if="message.message_type === 'system'"
              class="text-center px-20"
            >
              <SystemMessage
                v-if="message.message_text"
                :text="message.message_text"
              />
              <!-- <UnsupportMessage v-else /> -->
            </div>
            <template
              v-else-if="message.message_type === 'client' && message.ad_id"
            >
              <PostTemplate
                :message
                :message_index="index"
              />
            </template>

            <PostTemplate
              v-else-if="
                message.platform_type === 'FB_POST' && message.fb_post_id
              "
              :message
              :message_index="index"
            />
            <!-- <UnsupportMessage
              v-else-if="
                message.message_mid && message.message_mid !== 'undefined'
              "
            /> -->
            <DoubleCheckIcon
              v-if="isLastPageMessage(message, index)"
              class="w-3 h-3 text-green-500 absolute -bottom-1.5 -right-11"
            />
          </div>
          <PageStaffAvatar
            :message
            v-if="isFromCurrentUser(message)"
          />
          <ClientRead
            @change_last_read_message="visibleFirstClientReadAvatar"
            :time="message.time"
          />
        </div>
        <StaffRead
          @change_last_read_message="visibleLastStaffReadAvatar"
          :time="message.time"
        />
      </div>
      <div
        v-for="message of messageStore.send_message_list"
        :key="message.temp_id"
        class="relative group flex flex-col gap-1 items-end py-2"
      >
        <div class="w-fit group relative flex gap-1 items-end">
          <!-- Hiển thị text message nếu có text -->
          <PageTempTextMessage
            v-if="message.text"
            :text="message.text"
            :mentions="message.mentions"
            :snap_replay_message="message.snap_replay_message"
            :is_error="message.error"
          />
          <!-- :class="{
            'border border-red-500 rounded-lg': message.error,
          }" -->
          <!-- Hiển thị attachment message nếu có attachments -->
          <PageTempAttachmentMessage
            v-else-if="message.message_attachments?.length"
            :attachments="message.message_attachments"
            :sizes="message.attachment_size"
            :platform_type="select_conversation?.platform_type"
            :class="{
              'border border-red-500': message.error,
            }"
          />
          <StaffAvatar
            :id="chatbotUserStore.chatbot_user?.user_id"
            class="w-8 h-8 rounded-oval flex-shrink-0"
          />
        </div>
        <SendStatus :is_error="message.error" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { listenerEventBus } from '@/event'
import { read_message } from '@/service/api/chatbox/n4-service'
import { getPageInfo, scrollToBottomMessage } from '@/service/function'
import { toastError } from '@/service/helper/alert'
import { flow } from '@/service/helper/async'
import {
  useChatbotUserStore,
  useCommonStore,
  useConversationStore,
  useMessageStore,
  useOrgStore,
} from '@/stores'
import { debounce, findLastIndex, remove, size, sortedIndexBy } from 'lodash'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import ClientAvatar from '@/components/Avatar/ClientAvatar.vue'
import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'
import ClientRead from '@/views/ChatWarper/Chat/CenterContent/MessageList/ClientRead.vue'
import FullPost from '@/views/ChatWarper/Chat/CenterContent/MessageList/FullPost.vue'
import PageStaffAvatar from '@/views/ChatWarper/Chat/CenterContent/MessageList/PageStaffAvatar.vue'
import PageTempAttachmentMessage from '@/views/ChatWarper/Chat/CenterContent/MessageList/PageTempAttachmentMessage.vue'
import PageTempTextMessage from '@/views/ChatWarper/Chat/CenterContent/MessageList/PageTempTextMessage.vue'
import PostTemplate from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate.vue'
import SendStatus from '@/views/ChatWarper/Chat/CenterContent/MessageList/SendStatus.vue'
import StaffRead from '@/views/ChatWarper/Chat/CenterContent/MessageList/StaffRead.vue'
import SystemMessage from '@/views/ChatWarper/Chat/CenterContent/MessageList/SystemMessage.vue'
import TimeSplit from '@/views/ChatWarper/Chat/CenterContent/MessageList/TimeSplit.vue'
import MessageItem from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem.vue'
import UnReadAlert from '@/views/ChatWarper/Chat/CenterContent/MessageList/UnReadAlert.vue'

import ChatIcon from '@/components/Icons/Chat.vue'
import DoubleCheckIcon from '@/components/Icons/DoubleCheck.vue'

import type { MessageInfo } from '@/service/interface/app/message'
import type { CbError } from '@/service/interface/function'
import type { DebouncedFunc } from 'lodash'
import type { Handler } from 'mitt'
import { is } from 'date-fns/locale'

/**dữ liệu từ socket */
interface CustomEvent extends Event {
  detail?: MessageInfo
}

const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const commonStore = useCommonStore()
const chatbotUserStore = useChatbotUserStore()
const orgStore = useOrgStore()

/**danh sách tin nhắn hiện tại */
// const list_message = ref<MessageInfo[]>([])
/**có đang load tin nhắn hay không */
const is_loading = ref(false)
/**gắn cờ đã load hết dữ liệu */
const is_done = ref(false)
/**phân trang */
const skip = ref(0)
/**phân trang */
const LIMIT = 20
/**giá trị scroll_height trước đó của danh sách tin nhắn */
let old_scroll_height = ref(0)
/** giá trị từ vị trí scroll tới cuối danh sách tin nhắn trước đó */
const old_position_to_bottom = ref(0)
/**danh sách các hàm debounce cho từng staff */
const list_debounce_staff = ref<{
  [index: string]: DebouncedFunc<any>
}>({})

/** hội thoại đang chọn */
const select_conversation = computed(() => {
  return conversationStore.select_conversation
})

/** danh sách tin nhắn */
const show_list_message = computed(() =>
  // xử lý logic hiển thị tin nhắn
  messageStore.list_message.filter(message => {
    // 1. Quan trọng: Nếu là tin nhắn quảng cáo (có ad_id) -> luôn hiển thị
    if (message.ad_id) return true
    // 2. Nếu là tin nhắn post (có fb_post_id) -> luôn hiển thị
    if (message.fb_post_id) return true

    // 2. Nếu có nội dung text hoặc postback -> hiển thị
    if (message.message_text || message.postback_title) return true
    /**  Khai báo attachments */
    const ATTACHMENTS = message.message_attachments
    // 2. Nếu không có attachments (và không có text) -> ẩn
    if (!ATTACHMENTS?.length) return false

    // 3. Kiểm tra xem có attachment nào hợp lệ để hiển thị không
    const HAS_VALID_ATTACHMENT = ATTACHMENTS.some(att => {
      // Nếu không phải template (ảnh, video...) -> hiển thị
      // Hoặc nếu là template thì phải có payload -> hiển thị
      if (att.type !== 'template' || att.payload) return true
      // Nếu là template thì phải có payload -> hiển thị
      return false
    })
    // Trả về true nếu có attachment hợp lệ
    return HAS_VALID_ATTACHMENT
  }),
)

/**vị trí của tin nhắn cuối cùng nhân viên gửi */
const last_client_message_index = computed(() =>
  findLastIndex(
    show_list_message.value,
    m => m.message_type === 'page' && !!m.message_metadata,
  ),
)

// lắng nghe sự kiện từ socket khi component được tạo ra
onMounted(() => {
  resetMessage()
  // // * reset danh sách tin nhắn lúc mới vào nếu không mở bằng modal
  // messageStore.list_message = []

  // if (true) {
  //   // * reset danh sách tin nhắn khi đổi khách hàng
  //   messageStore.list_message = []

  //   // * reset danh sách tin nhắn chờ
  //   messageStore.send_message_list = []

  //   // reset cờ đã load hết dữ liệu
  //   is_done.value = false

  //   // reset phân trang
  //   skip.value = 0

  //   getListMessage(true)
  // }

  // tin nhắn mới
  // window.addEventListener('chatbox_socket_message', socketNewMessage)

  // cập nhật tin nhắn
  // window.addEventListener('chatbox_socket_update_message', socketUpdateMssage)
})

// hủy lắng nghe sự kiện từ socket khi component bị hủy
// onUnmounted(() => {
//   // tin nhắn mới
//   // window.removeEventListener('chatbox_socket_message', socketNewMessage)

//   // cập nhật tin nhắn
//   // window.removeEventListener(
//   //   'chatbox_socket_update_message',
//   //   socketUpdateMssage,
//   // )
// })

// lắng nghe sự kiện tin nhắn mới, tạm thời ép kiểu
listenerEventBus('chatbox_socket_message', socketNewMessage as Handler<unknown>)

// lắng nghe sự kiện cập nhật tin nhắn, tạm thời ép kiểu
listenerEventBus(
  'chatbox_socket_update_message',
  socketUpdateMssage as Handler<unknown>,
)

watch(
  () => select_conversation.value,
  (new_val, old_val) => {
    resetMessage()
    // // * reset danh sách tin nhắn khi đổi khách hàng
    // messageStore.list_message = []

    // // * reset danh sách tin nhắn chờ
    // messageStore.send_message_list = []

    // // reset cờ đã load hết dữ liệu
    // is_done.value = false

    // // reset phân trang
    // skip.value = 0

    // getListMessage(true)
  },
)

/** hàm lấy các dữ liệu của tin nhắm */
function getMessageMeta(message: MessageInfo) {
  /** id của khách hàng */
  const CLIENT_ID = conversationStore.select_conversation?.fb_client_id
  return {
    TYPE: message.message_type,
    IS_AD: Boolean(message.ad_id),
    IS_POST: Boolean(message.fb_post_id),
    IS_FROM_CLIENT: message.sender_id === CLIENT_ID,
  }
}

/** có phải tin nhắn của bản thân không */
function isFromCurrentUser(message: MessageInfo) {
  const { TYPE, IS_AD, IS_FROM_CLIENT } = getMessageMeta(message)
  /** là ghi chú của bản thân tạo */
  const IS_CURRENT_USER_NOTE = TYPE === 'note' && !IS_FROM_CLIENT
  return TYPE === 'page' || IS_AD || IS_CURRENT_USER_NOTE
}

/** có phải tin của khách không */
function isClientMessage(message: MessageInfo) {
  const { TYPE, IS_AD, IS_FROM_CLIENT, IS_POST } = getMessageMeta(message)

  return (
    IS_POST ||
    (TYPE === 'client' && !IS_AD) ||
    TYPE === 'group' ||
    (TYPE === 'note' && IS_FROM_CLIENT)
  )
}

/**làm mới dữ liệu nhắn tin */
function resetMessage() {
  // * reset danh sách tin nhắn khi đổi khách hàng
  messageStore.list_message = []
  // reset map danh sách tin nhắn
  messageStore.map_list_message_by_id.clear()

  // * reset danh sách tin nhắn chờ
  messageStore.send_message_list = []

  // reset cờ đã load hết dữ liệu
  is_done.value = false

  // reset phân trang
  skip.value = 0

  getListMessage(true)
}
/**có khoá truy cập của trang này không */
function isLockPage(): boolean {
  // chỉ lock với gói free
  if (!orgStore.isFreePack()) return false

  // nếu tổ chức bị lock thì lock toàn bộ trang
  if (orgStore.selected_org_info?.org_package?.org_is_lock_client) return true

  // nếu page bị lock từ trước, thì cũng lock
  if (getPageInfo(select_conversation.value?.fb_page_id)?.is_lock_client)
    return true

  // tổ chức free + page chưa bị lock -> ok
  return false
}
/**kiểm tra xem tin nhắn này có phải là tin nhắn cuối cùng của nhân viên gửi không */
function isLastPageMessage(message: MessageInfo, index: number) {
  // chỉ tính tin nhắn của trang
  if (message.message_type !== 'page') return false
  // phải là tin do nhân viên gửi
  if (!message.message_metadata) return false

  // nếu là tin nhắn cuối cùng của nhân viên gửi
  return index === last_client_message_index.value
}

/**
 * Chèn tin nhắn vào danh sách tin nhắn theo đúng thời gian
 * - sử dụng binary search để tìm index cần chèn, tối ưu hiệu năng
 * - chèn đúng vị trí, không ảnh hưởng đến thứ tự của danh sách
 * - không loop cả mảng
 */
function insertMessageSorted(list_message: MessageInfo[], msg: MessageInfo) {
  /**binary search index cần chèn dựa trên field time */
  const INDEX = sortedIndexBy(list_message, msg, 'createdAt')

  // Chèn đúng vị trí
  list_message.splice(INDEX, 0, msg)
}
/**xử lý socket tin nhắn mới */
function socketNewMessage({ detail }: CustomEvent) {
  // nếu không có dữ liệu thì thôi
  if (!detail) return

  // nếu không phải của khách hàng đang chọn thì chặn
  if (
    detail.fb_page_id !== select_conversation.value?.fb_page_id ||
    detail.fb_client_id !== select_conversation.value.fb_client_id
  )
    return

  // nếu là tin nhắn của khách thì gửi cho toàn bộ các widget
  if (detail?.message_type === 'client' && detail?.message_text) {
    document.querySelectorAll('iframe')?.forEach(iframe => {
      iframe?.contentWindow?.postMessage(
        {
          from: 'CHATBOX',
          type: 'CLIENT_MESSAGE',
          payload: { message: detail?.message_text },
        },
        '*',
      )
    })
  }

  // nếu là dạng comment bài post thì loại bỏ các post cũ, để post mới sẽ lên đầu
  if (size(detail.comment))
    remove(messageStore.list_message, message => message._id === detail._id)

  // lấy div chứa danh sách tin nhắn
  const LIST_MESSAGE = document.getElementById(messageStore.list_message_id)

  /** vị trí scroll */
  const SCROLL_POSITION =
    (LIST_MESSAGE?.scrollTop || 0) + (LIST_MESSAGE?.clientHeight || 0)

  /** có đang scroll xuống dưới cùng không? */
  const IS_BOTTOM = SCROLL_POSITION === LIST_MESSAGE?.scrollHeight

  // nếu có message_mid và chưa có trong mảng thì mới thêm
  if (
    detail.message_mid &&
    !messageStore.map_list_message_by_id.has(detail.message_mid)
  ) {
    // thêm tin nhắn vào danh sách
    insertMessageSorted(messageStore.list_message, detail)
    // messageStore.list_message.push(detail)

    // thêm tin nhắn vào map
    messageStore.map_list_message_by_id.set(detail.message_mid, detail)
  }

  // xử lý khi gặp trường hợp phát hiện tin nhắn chờ
  if (detail?.message_mid && messageStore.send_message_list?.length) {
    // xóa tin nhắn tạm
    remove(messageStore.send_message_list, message => {
      /** trùng id tin nhắn */
      const IS_MATCH_MESSAGE_ID = message.message_id === detail?.message_mid

      /** trùng replay_mid tin nhắn */
      const IS_MATCH_REPLAY_MESSAGE_ID =
        message.replay_mid && message.replay_mid === detail?.replay_mid

      /**có phải tin nhắn tạm cần xóa không */
      const IS_MATCH = IS_MATCH_MESSAGE_ID || IS_MATCH_REPLAY_MESSAGE_ID

      // nếu tìm thấy tin nhắn tạm cần xóa
      // if (IS_MATCH) {
      /**lấy temp_id của tin nhắn */
      const TEMP_ID = message?.temp_id

      /**lấy timer clear tin nhắn tạm */
      // const TIMER = messageStore.timer_clear_send_message_list.get(TEMP_ID)

      // // nếu có timer clear tin nhắn tạm
      // if (TIMER) {
      //   // xóa timer clear tin nhắn tạm, vì không cần nữa
      //   clearTimeout(TIMER)

      //   // xóa biến lưu id của timer clear tin nhắn tạm
      //   messageStore.timer_clear_send_message_list.delete(TEMP_ID)
      // }
      // }

      // trả về kết quả
      return IS_MATCH
    })
  }

  /**
   * Xử lý clear temp message dựa trên URL attachment
   * Áp dụng cho các platform không phải FB khi gửi nhiều ảnh
   * Socket sẽ trả về từng tin riêng, mỗi tin có 1 attachment
   */
  // if (detail?.message_attachments?.length) {
  //   /** Lấy danh sách URL của attachment trong tin nhắn socket */
  //   const SOCKET_URLS = detail.message_attachments
  //     .map((att: any) => att?.payload?.url || att?.url)
  //     .filter(Boolean)

  //   /** Flag để check đã xóa temp message chưa */
  //   let is_cleared = false

  //   /** Xóa temp message có attachment URL trùng khớp */
  //   if (SOCKET_URLS.length) {
  //     /** Kiểm tra và xóa temp message có URL trùng */
  //     const REMOVED = remove(messageStore.send_message_list, temp_msg => {
  //       /** Kiểm tra temp message có attachment nào trùng URL không */
  //       const HAS_MATCHING_URL = temp_msg.message_attachments?.some(temp_att =>
  //         SOCKET_URLS.includes(temp_att.url)
  //       )
  //       return HAS_MATCHING_URL
  //     })
  //     /** Đánh dấu đã clear nếu có xóa được */
  //     if (REMOVED.length) is_cleared = true
  //   }

  //   /**
  //    * Fallback cho Zalo và các platform khác:
  //    * URL từ server có thể khác với URL temp (re-upload, encode khác)
  //    * Nếu tin nhắn socket là từ page và có attachment, xóa temp message attachment cũ nhất
  //    */
  //   if (!is_cleared && detail?.message_type === 'page') {
  //     /** Tìm temp message có attachment */
  //     const TEMP_INDEX = messageStore.send_message_list.findIndex(
  //       temp_msg => temp_msg.message_attachments?.length && !temp_msg.error
  //     )
  //     /** Nếu tìm thấy thì xóa */
  //     if (TEMP_INDEX !== -1) {
  //       messageStore.send_message_list.splice(TEMP_INDEX, 1)
  //     }
  //   }
  // }

  // nếu đang ở vị trí bottom thì dùng scrollToBottomMessage
  if (IS_BOTTOM) scrollToBottomMessage(messageStore.list_message_id)

  // Update vị trí "người đã đọc" sau khi có tin nhắn mới
  nextTick(() => {
    visibleFirstClientReadAvatar()
  })
}
/**xử lý socket cập nhật tin nhắn hiện tại */
function socketUpdateMssage({ detail }: CustomEvent) {
  // nếu không có dữ liệu thì thôi
  if (!detail) return

  // nếu không phải của khách hàng đang chọn thì chặn
  if (
    detail.fb_page_id !== select_conversation.value?.fb_page_id ||
    detail.fb_client_id !== select_conversation.value.fb_client_id
  )
    return

  // cập nhật dữ liệu của tin nhắn
  messageStore.list_message?.forEach(message => {
    // tìm đến tin nhắn bằng id, sau đó sao chép dữ liệu mới vào object cũ
    if (message._id === detail._id) Object.assign(message, detail)
  })
}
/**lắng nghe sự kiện khi scroll danh sách tin nhắn */
function onScrollMessage($event: Event) {
  // xử lý ẩn hiện nút về bottom
  handleButtonToBottom($event as UIEvent)

  // xử lý load dữ liệu tin nhắn
  debounceLoadMoreMessage($event as UIEvent)
}

/** hàm debounce load dữ liệu tin nhắn */
const debounceLoadMoreMessage = debounce(
  $event => loadMoreMessage($event as UIEvent),
  300,
)

/**ẩn hiện nút về bottom */
function handleButtonToBottom($event: UIEvent) {
  /**div chưa danh sách tin nhắn */
  const LIST_MESSAGE = $event?.target as HTMLElement

  let { scrollHeight, scrollTop, clientHeight } = LIST_MESSAGE

  /**giá trị khoảng cách scroll với bottom */
  const SCROLL_BOTTOM = scrollHeight - scrollTop - clientHeight

  /**
   * xử lý như thế này để giảm tải việc thay đổi store liên tục, nếu không
   * có khả năng bị lag, treo, khi có nhiều nơi watch store, send event mà
   * mình không phát hiện ra
   */
  if (SCROLL_BOTTOM > 400 && !messageStore.is_show_to_bottom) {
    messageStore.is_show_to_bottom = true
  }
  if (SCROLL_BOTTOM <= 400 && messageStore.is_show_to_bottom) {
    messageStore.is_show_to_bottom = false
  }
}
/**load thêm dữ liệu khi lăn chuột lên trên */
function loadMoreMessage($event: UIEvent) {
  /**div chưa danh sách tin nhắn */
  const LIST_MESSAGE = $event?.target as HTMLElement

  if (!LIST_MESSAGE) return

  /**giá trị scroll top hiện tại */
  const SCROLL_TOP = LIST_MESSAGE?.scrollTop

  /** nếu đang chạy hoặc đã hết dữ liệu thì thôi */
  if (is_loading.value || is_done.value) return

  /** infinitve loading scroll */
  if (SCROLL_TOP < 500) getListMessage()
}
/**đọc danh sách tin nhắn */
function getListMessage(is_scroll?: boolean) {
  /** nếu đang mất mạng thì không cho gọi api */
  if (!commonStore.is_connected_internet) return

  /** nếu chưa chọn khách hàng thì thôi */
  if (!select_conversation.value?.fb_page_id) return
  if (!select_conversation.value?.fb_client_id) return

  /**id tin nhắn trên đầu của lần loading trước */
  let old_first_message_id = messageStore.list_message?.[0]?._id

  flow(
    [
      /** bật loading */
      (cb: CbError) => {
        is_loading.value = true

        /** thẻ div chứa danh sách tin nhắn */
        const LIST_MESSAGE = document.getElementById(
          messageStore.list_message_id,
        )

        /** nếu có thì thôi */
        if (!LIST_MESSAGE) return cb()

        /** lưu lại bị vị trí scroll hiện tại */
        old_position_to_bottom.value =
          LIST_MESSAGE?.scrollHeight - LIST_MESSAGE?.scrollTop

        cb()
      },
      /** đọc dữ liệu từ api */
      (cb: CbError) => tryLoadUntilScrollable(cb),
      /** làm cho scroll to top mượt hơn */
      (cb: CbError) => {
        /** chạy infinitve loading scroll */
        nextTick(() => {
          /** lấy div chưa danh sách tin nhắn */
          const LIST_MESSAGE = document.getElementById(
            messageStore.list_message_id,
          )

          /** nếu không có thì thôi */
          if (!LIST_MESSAGE) return

          /** Scroll lại div cho về đúng giá trị trước -> gần như mượt */
          LIST_MESSAGE.scrollTop =
            LIST_MESSAGE.scrollHeight - old_position_to_bottom.value
        })

        cb()
      },
    ],
    e => {
      /** tắt loading */
      is_loading.value = false

      /** load lần đầu thì tự động cuộn xuống */
      if (is_scroll) {
        scrollToBottomMessage(messageStore.list_message_id)

        setTimeout(
          () => scrollToBottomMessage(messageStore.list_message_id),
          500,
        )
      }

      if (e) {
        /** gắn cờ đã load hết dữ liệu */
        is_done.value = true

        // tắt loading nếu lỗi
        is_loading.value = false

        return toastError(e)
      }

      // tắt loading
      if (!is_scroll) is_loading.value = false

      // load lần đầu thì tự động cuộn xuống
      if (is_scroll) {
        // tự động cuộn xuống
        scrollToBottomMessage(messageStore.list_message_id)
        // tắt loading sau khi scroll sau 0.3s
        setTimeout(() => {
          scrollToBottomMessage(messageStore.list_message_id)
          // tắt loading sau khi scroll
          is_loading.value = false
        }, 300)
      }
    },
  )
}
/**
 * chỉ hiển thị avatar khách hàng đã đọc đến tin nhắn đầu tiên
 * vì cùng mội thời điểm sẽ có nhiều div thoả mãn điều kiện gửi event
 * nên sử dụng debounce để chỉ chạy event cuối cùng, tránh bị lặp code
 */
const visibleFirstClientReadAvatar = debounce(() => {
  /** danh sách các phần tử avatar đánh dấu khách đọc */
  const ELEMENTS = document.querySelectorAll('.mesage-client-read')

  /** nếu không có thì thôi */
  if (!ELEMENTS?.length) return

  /** nếu có thì ẩn tất cả chỉ hiện phần tử cuối cùng */
  ELEMENTS.forEach((el, index) => {
    /** phần tử avatar đánh dấu khách đọc */
    const ELEMENT = el as HTMLElement
    /** nếu không có thì thôi */
    if (!ELEMENT) return
    /** nếu là phần tử cuối cùng thì hiện */
    if (index === ELEMENTS.length - 1) {
      ELEMENT.style.display = 'block'
    } else {
      /** nếu khác phần tử cuối cùng thì ẩn */
      ELEMENT.style.display = 'none'
    }
  })
}, 50)
/**
 * chỉ hiển thị avatar nhân viên đã đọc tin nhắn cuối cùng
 * vì cùng mội thời điểm sẽ có nhiều div thoả mãn điều kiện gửi event
 * nên sử dụng debounce để chỉ chạy event cuối cùng, tránh bị lặp code
 */
function visibleLastStaffReadAvatar(staff_id: string) {
  /** init hàm debounce cho từng staff nếu không tồn tại */
  if (!list_debounce_staff.value[staff_id])
    list_debounce_staff.value[staff_id] = debounce(doVisibleAvatar, 50)

  /** chạy hàm debounce */
  list_debounce_staff.value[staff_id](staff_id)

  /**hiển thị avatar staff cuối cùng */
  function doVisibleAvatar(staff_id: string) {
    /**toàn bộ các div avatar */
    const LIST_AVATAR: HTMLElement[] = Array.from(
      document.querySelectorAll(`.message-staff-read-${staff_id}`),
    )

    /** lặp qua toàn bộ các div */
    LIST_AVATAR.forEach((element: any, i: number) => {
      /** reset ẩn toàn bộ các avatar hiện tại */
      if (i < LIST_AVATAR.length - 1) element.style.display = 'none'
      /** chỉ hiển thị avatar cuối cùng */ else element.style.display = 'block'
    })
  }
}

/** hàm load dữ liệu cho đến khi danh sách có thể scroll */
const tryLoadUntilScrollable = (cb: CbError) => {
  read_message(
    {
      page_id: conversationStore.select_conversation?.fb_page_id,
      client_id: conversationStore.select_conversation?.fb_client_id,
      skip: skip.value,
      limit: LIMIT,
    },
    (e, r) => {
      /** nếu lỗi thì thôi */
      if (e) return cb(e)

      /** không có kết quả thì thôi hoặc đã lấy hết dữ liệu thì thôi */
      if (!r || !r.length) {
        is_done.value = true
        return cb()
      }

      /** đảo ngược mảng */
      r.reverse()

      /** thêm vào danh sách lên đầu */
      messageStore.list_message.unshift(...r)

      // lặp qua các tin nhắn để lưu vào map list_message_by_id
      r?.forEach(message => {
        // nếu không có message_mid thì thôi
        if (!message.message_mid) return
        // lưu lại vào map
        messageStore.map_list_message_by_id.set(message.message_mid, message)
      })

      /** trang tiếp theo */
      skip.value += LIMIT

      /** ⚠️ Gọi lại nếu chưa scroll được */
      /** Dùng nextTick nếu Vue chưa render kịp */
      nextTick(() => {
        /** lấy div chưa danh sách tin nhắn */
        const LIST_MESSAGE = document.getElementById(
          messageStore.list_message_id,
        )

        /** nếu không có thì thôi */
        if (!LIST_MESSAGE) return cb()

        /** nếu chưa thể scroll thì load tiếp */
        if (
          LIST_MESSAGE.scrollHeight <= LIST_MESSAGE.clientHeight &&
          !is_done.value
        ) {
          /** chưa scroll được, tiếp tục load thêm */
          tryLoadUntilScrollable(cb)
        } else {
          /** đã scroll được, hoặc đã hết dữ liệu */
          cb()
        }
      })
    },
  )
}
</script>
<style scoped lang="scss"></style>
