<template>
  <div class="w-full h-full relative mb-1">
    <!-- {{ input_chat_ref?.innerText }} -->
    <div
      ref="input_chat_ref"
      id="chat-text-input-message"
      @input="$main.calcIsTyping"
      @keydown.enter="$main.submitInput"
      @keydown.tab="$main.handleTab"
      @paste="$main.onPasteImage"
      @keyup="$emit('keyup', $event)"
      class="max-h-32 overflow-hidden overflow-y-auto w-full h-full focus:outline-none word-break-break-word"
      contenteditable="true"
    />
    <span
      v-if="!commonStore.is_typing"
      class="absolute text-sm text-slate-500 pointer-events-none top-1/2 -translate-y-1/2 truncate w-full"
    >
      <template v-if="is_over_time">
        {{
          $t('Đã quá 7 ngày kể từ tin nhắn cuối cùng. _')
        }}
      </template>
      <template
        v-else-if="
          conversationStore.select_conversation?.conversation_type === 'POST'
        "
      >
        {{
          $t('Bình luận dưới tên _', {
            name: conversationStore.getPage()?.name,
          })
        }}
      </template>
      <template v-else>
        <!-- {{
          $t("Gửi tin nhắn đến _. Sử dụng '/' để trả lời nhanh.", {
            name: conversationStore.select_conversation?.client_name,
          })
        }} -->
        {{
          $t("Trả lời từ _. Sử dụng '/' để trả lời nhanh.", {
            // name: conversationStore.select_conversation?.client_name,
            name: page_name,
          })
        }}
      </template>
    </span>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useConversationStore,
  useMessageStore,
  useCommonStore,
  usePageStore,
  useOrgStore,
} from '@/stores'
import { send_message } from '@/service/api/chatbox/n4-service'
import { dispatchEventBus } from '@/event'
import { map, get, size, uniqueId, partition, set, remove } from 'lodash'
import { srcImageToFile } from '@/service/helper/file'
import { scrollToBottomMessage } from '@/service/function'
import { sendTextMesage, sendImageMessage } from '@/service/helper/ext'
import { eachOfLimit, waterfall } from 'async'
import { toastError } from '@/service/helper/alert'
import { N6StaticAppUploadFile, type Uploadtype } from '@/utils/api/N6Static'
import { container } from 'tsyringe'
import { Delay } from '@/utils/helper/Delay'
import { composableService } from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/service'
import { error } from '@/utils/decorator/Error'
import { loadingV2 } from '@/utils/decorator/Loading'
import { N4SerivceAppPost } from '@/utils/api/N4Service/Post'
import { composableService as inputComposableService } from '@/views/ChatWarper/Chat/CenterContent/InputChat/MainInput/service'

import FacebookError from '@/components/Main/Dashboard/FacebookError.vue'

import type { Cb, CbError } from '@/service/interface/function'
import type { UploadFile } from '@/service/interface/app/album'
import {
  N4SerivceAppConversation,
  N4SerivceAppMessage,
} from '@/utils/api/N4Service/Conversation'

const { ToastReplyComment } = composableService()
const { InputService } = inputComposableService()

const $emit = defineEmits<{
  /**xuất sự kiện keyup ra bên ngoài */
  keyup: [$event: KeyboardEvent]
}>()

const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const commonStore = useCommonStore()
const pageStore = usePageStore()
const orgStore = useOrgStore()
const { t: $t } = useI18n()
const $delay = container.resolve(Delay)

/**ref của ô chat tin nhắn */
const input_chat_ref = ref<HTMLDivElement>()
/**ref của component facebook error */
const facebook_error_ref = ref<InstanceType<typeof FacebookError>>()
/** error fb trả về */
const facebook_error = ref<{
  code?: number
  message?: string
}>()

import { getPageStaff } from '@/service/function'
import { values } from 'lodash'
import type Mention from '@/views/ChatWarper/Chat/CenterContent/InputChat/MainInput/Mention.vue'
import type { ConversationInfo } from '@/service/interface/app/conversation'
import type { PageList } from '@/service/interface/app/page'
import { N6StaticAppUploadFileV2 } from '@/utils/api/N6StaticV2'
import { resizeImage } from '@/utils/helper/ResizeImage/image-resize.main'

/**props */
const $props = defineProps<{
  /**ref của Mention component */
  mention_ref?: InstanceType<typeof Mention>
  /** cờ check xem quá hạn gửi hay chưa */
  is_over_time?: boolean
}>()

/**id trang */
const page_id = computed(
  () => conversationStore.select_conversation?.fb_page_id,
)
/**id khách */
const client_id = computed(
  () => conversationStore.select_conversation?.fb_client_id,
)
/**loại nền tảng */
const platform_type = computed(
  () => conversationStore.select_conversation?.platform_type,
)
/** Render tên page */
const page_name = computed(() => {
  /** Lấy list page */
  const LIST = orgStore.list_os || []
  /** lấy page trùng với page hiện tại */
  const PAGE = LIST.find(p => p.page_id === page_id.value)
  /** Nếu k có page thì return '' */
  if (!PAGE) return ''
  /** Lấy tên gợi nhớ */
  const ALIAS = PAGE.page_info?.alias
  /** Lấy tên mặc định */
  const NAME = PAGE.page_info?.name
  /** Nếu có Tên gợi nhớ thì lấy tên gợi nhớ, không thì lấy tên mặc định */
  return ALIAS && ALIAS.trim() !== '' ? ALIAS : NAME || ''
})

/**
 * Khi chuyển conversation:
 * - Clear nội dung input để hiển thị lại placeholder
 * - Reset trạng thái mention modal nếu đang mở
 */
watch(
  () => conversationStore.select_conversation?.data_key,
  () => {
    $main.clearInputText()
    /** Nếu mention modal đang mở thì tắt đi */
    if (commonStore.is_show_mention) {
      commonStore.is_show_mention = false
    }
  },
)

/**
 * Lấy kích thước thực tế của ảnh từ phần preview
 * @param id - id ảnh
 * @returns Promise với width và height do logic cũ của anh Trường đang dùng
 * callback nên vẫn giữ trả về là promise để không sửa nhiều
 */
function getImageSize(id: string): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    /** ảnh cần lấy kích thước */
    const IMAGE = document.getElementById(id) as HTMLImageElement
    // nếu không tìm thấy narh nào thì trả về kích thúc 200x200
    if (!IMAGE) {
      return resolve({ width: 200, height: 200 })
    }
    // nếu có thì trả về kích thước của ảnh đó
    resolve({
      width: IMAGE?.naturalWidth,
      height: IMAGE?.naturalHeight,
    })
  })
}

const handleErrorReplyComment = error(
  container.resolve(ToastReplyComment),
  messageStore.clearReplyComment,
)
/**decorator xử lý khi đang loading trả lời bình luận */
const handleLoadingReplyComment = loadingV2(
  messageStore,
  'reply_comment.is_loading',
)

class Main {
  /**
   * @param API_POST API của bài viết
   */
  constructor(
    private readonly API_POST = container.resolve(N4SerivceAppPost),
    private readonly API_MESSAGE = container.resolve(N4SerivceAppMessage),
    private readonly SERVICE_INPUT = container.resolve(InputService),
    private readonly API_CONVERSATION = container.resolve(
      N4SerivceAppConversation,
    ),
  ) {}

  /**xử lý sự kiện tab */
  async handleTab($event: KeyboardEvent) {
    /** nếu không có câu trả lời của ai thì thôi */
    if (!conversationStore.select_conversation?.ai_answer) return
    if (!page_id.value || !client_id.value) return

    /** chặn sự kiện mặc định của tab */
    $event.preventDefault()

    /** ghi đè nội dung vào ô chat */
    this.SERVICE_INPUT.setInputText(
      conversationStore.select_conversation?.ai_answer,
    )

    /** xóa câu trả lời của ai */
    await this.clearAiAnswer()
  }
  /**loại bỏ dữ liệu câu trả lời của AI */
  async clearAiAnswer() {
    /** nếu không có câu trả lời của ai thì thôi */
    if (!conversationStore.select_conversation?.ai_answer) return
    if (!page_id.value || !client_id.value) return

    /** xóa câu trả lời của ai hiện tại */
    conversationStore.select_conversation.ai_answer = ''

    /** xóa câu trả lời ai trong danh sách hội thoại */
    set(
      conversationStore.conversation_list,
      [conversationStore.select_conversation?.data_key || '', 'ai_answer'],
      '',
    )

    /** xóa câu trả lời ai trên server */
    await this.API_CONVERSATION.clearAiAnswer(page_id.value, client_id.value)
  }
  /**tính toán xem ô input có dữ liệu không */
  async calcIsTyping($event: Event) {
    /**thẻ div input */
    const INPUT_DIV = $event.target as HTMLDivElement

    /**nội dung */
    const INPUT_VALUE = INPUT_DIV?.innerText?.trim()

    /** gắn cờ input có dữ liệu */
    commonStore.is_typing = !!INPUT_VALUE
  }
  /**lấy ảnh khi được ctrl + v vào input */
  onPasteImage() {
    /** nếu không thể gửi tin nhắn thì không cho paste file */
    if (!messageStore.is_can_send_message) return

    setTimeout(() => {
      /**ô input */
      const PARENT = input_chat_ref.value

      /** loop dữ liệu input để tìm các img được paste vào */
      map(PARENT?.children, (element: HTMLElement) => {
        /** chỉ xử lý img */
        if (element?.tagName !== 'IMG') return

        /** lấy source của hình ảnh */
        const SRC = (element as HTMLImageElement).src

        /** loại bỏ hình ảnh khỏi input */
        PARENT?.removeChild(element)

        srcImageToFile(SRC, (e, r) => {
          if (e || !r) return

          /** id của file để thêm attr id khi render */
          const ID = crypto.randomUUID()

          messageStore.upload_file_list.push({
            id: ID,
            source: r,
            file_name: r.name,
            type: 'image',
            preview: SRC,
          })
        })
      })
    }, 100)
  }
  /**xử lý sự kiện nhấn enter ở ô chat */
  async submitInput($event: KeyboardEvent) {
    /** nếu bấm shift + enter thì chỉ xuống dòng, không submit */
    if ($event.shiftKey) return

    /** nếu chỉ bấm enter thì chặn không cho xuống dòng, để xử lý logic gửi tin nhắn */
    $event.preventDefault()

    /** nếu không thể gửi tin nhắn thì không cho paste file */
    if (!messageStore.is_can_send_message) return

    /** delay 1 chút, tránh lỗi bộ gõ TV mac x2 event với keydown */
    await $delay.exec(10)

    /** nếu đang mở trả lời nhanh thì không submit, mà chạy vào logic chọn câu trả lời */
    if (commonStore.is_show_quick_answer) return
    /** nếu đang mở mention modal thì không submit */
    if (commonStore.is_show_mention) return
    /** nếu không thì gửi tin nhắn bình thường */ else this.sendMessage()
  }
  /**gửi tin nhắn */
  async sendMessage() {
    /** đang gửi file thì không cho click nút gửi, tránh bị gửi lặp */
    if (messageStore.is_send_file) return
    conversationStore.selected_client_id = client_id.value

    /** bắt buộc phải có id của trang và khách */
    if (!page_id.value || !client_id.value) return

    /** tránh trường hợp đang gửi, lại chuyển page, nên sẽ giữ cố định id */
    /**id trang */
    const PAGE_ID = page_id.value
    /*id khách */
    const CLIENT_ID = client_id.value
    /** id FB */
    const FB_UID = conversationStore.select_conversation?.client_bio?.fb_uid
    /** Lưu selected client id */
    /**div input */
    const INPUT = input_chat_ref.value as HTMLDivElement
    /**nội dung tin nhắn */
    const TEXT = INPUT.innerText.trim()

    /** nếu có nội dung tin nhắn */
    if (TEXT) {
      /** xử lý luồng bình luận riêng nếu có, và dừng tiến trình luôn */
      switch (messageStore.reply_comment?.type) {
        /** trả lời bình luận */
        case 'REPLY':
          return this.replyComment(PAGE_ID, TEXT)

        /** trả lời tin nhắn bí mật */
        case 'PRIVATE_REPLY':
          return this.privateReply(PAGE_ID, CLIENT_ID, TEXT)
      }

      if (messageStore.reply_message?.type === 'REPLY_MESSAGE') {
        return this.sendReplyMessage(PAGE_ID, CLIENT_ID, TEXT)
      }
      /** gửi text */
      this.sendText(PAGE_ID, CLIENT_ID, TEXT, INPUT, FB_UID)
    }

    /** gửi file */
    /** if (size(messageStore.upload_file_list)) this.sendFile(PAGE_ID, CLIENT_ID) */
    if (size(messageStore.upload_file_list)) {
      this.sendFileHorizontal(
        PAGE_ID,
        CLIENT_ID,
        conversationStore.select_conversation,
        pageStore.selected_page_list_info,
        FB_UID,
      )
    }

    /** xóa câu trả lời của ai */
    await this.clearAiAnswer()
  }
  /** tính toán mentions */
  calcMentions(page_id: string, text: string) {
    /** nếu không phải là nhóm thì thôi */
    if (!conversationStore.select_conversation?.is_group) return []

    const MENTIONS: { offset: number; length: number; id: string }[] = []

    /** lấy mention_ref từ props */
    const MENTION_REF = $props.mention_ref

    /** nếu không có mention_ref thì thôi */
    if (!MENTION_REF) return []

    /** lấy tất cả member names đã được chọn từ map */
    const MEMBER_NAMES: string[] = []
    MENTION_REF.selected_members_map?.forEach(
      (client_id: string, name: string) => {
        MEMBER_NAMES.push(name)
      },
    )

    /** sắp xếp theo độ dài giảm dần để tránh match nhầm */
    MEMBER_NAMES.sort((a, b) => b.length - a.length)

    /** tìm từng member name trong text */
    const OCCUPIED_RANGES: { start: number; end: number }[] = []

    for (const NAME of MEMBER_NAMES) {
      const SEARCH_PATTERN = `@${NAME}`
      let start_index = 0

      while (true) {
        const INDEX = text.indexOf(SEARCH_PATTERN, start_index)
        if (INDEX === -1) break

        const END_INDEX = INDEX + SEARCH_PATTERN.length

        /** kiểm tra trùng lặp */
        const is_overlap = OCCUPIED_RANGES.some(
          range =>
            Math.max(INDEX, range.start) < Math.min(END_INDEX, range.end),
        )

        if (!is_overlap) {
          /** lấy client_id từ mapping */
          const CLIENT_ID = MENTION_REF.getClientIdByName(NAME)

          console.log(
            '✅ Found mention:',
            SEARCH_PATTERN,
            'at',
            INDEX,
            'id:',
            CLIENT_ID,
          )

          if (CLIENT_ID) {
            MENTIONS.push({
              offset: INDEX,
              length: SEARCH_PATTERN.length,
              id: CLIENT_ID,
            })
            OCCUPIED_RANGES.push({ start: INDEX, end: END_INDEX })
          }
        }

        start_index = END_INDEX
      }
    }

    /** sắp xếp mentions theo offset */
    MENTIONS.sort((a, b) => a.offset - b.offset)

    return MENTIONS
  }
  /**luồng trả lời tin nhắn bí mật */
  @handleLoadingReplyComment
  @handleErrorReplyComment
  async privateReply(page_id: string, client_id: string, text: string) {
    /** xoá dữ liệu trong input */
    this.clearInputText()

    /** xác thực dữ liệu */
    if (!messageStore.reply_comment?.root_comment_id) return
    if (!messageStore.reply_comment?.post_id) return

    /**gửi tin */
    const RES = await this.API_POST.sendPrivateReply(
      page_id,
      client_id,
      messageStore.reply_comment?.post_id,
      messageStore.reply_comment?.root_comment_id,
      text,
    )

    /** gắn cờ là đã trả lời bí mật cho tin nhắn */
    set(
      messageStore.list_message,
      [messageStore.reply_comment?.message_index || 0, 'is_private_reply'],
      true,
    )

    /** xoá dữ liệu trả lời */
    messageStore.clearReplyComment()
  }
  /**luồng trả lời bình luận */
  @handleLoadingReplyComment
  @handleErrorReplyComment
  async replyComment(page_id: string, text: string) {
    /** xoá dữ liệu trong input */
    this.clearInputText()

    /** xác thực dữ liệu */
    if (!messageStore.reply_comment?.root_comment_id) return

    /**gửi bình luận */
    const RES = await this.API_POST.sendComment(
      page_id,
      messageStore.reply_comment?.root_comment_id,
      text,
    )

    /** nếu có lỗi thì throw ra */
    if (get(RES, 'error')) {
      throw get(RES, 'error')
    }

    /**bình luận được trả lời */
    const COMMENT =
      messageStore.list_message?.[
        messageStore.reply_comment?.message_index || 0
      ]

    /** tiêm dữ liệu trả lời vào bình luận này */
    COMMENT?.reply_comments?.unshift({
      comment_id: RES.id || '',
      message: text,
      from: { name: conversationStore.getPage()?.name },
      createdAt: new Date().toISOString(),
    })

    /** loại bỏ comment này khỏi danh sách */
    remove(messageStore.list_message, message => message._id === COMMENT._id)

    /** thêm lại vào cuối */
    messageStore.list_message.push(COMMENT)

    /** xoá dữ liệu trả lời */
    messageStore.clearReplyComment()

    scrollToBottomMessage(messageStore.list_message_id)
  }
  async sendReplyMessage(page_id: string, client_id: string, text: string) {
    /** xoá dữ liệu trong input */
    this.clearInputText()

    /** xác thực dữ liệu */
    if (!messageStore.reply_message?.message_id) return
    /** Lấy list page */
    const LIST = orgStore.list_os || []
    /** lấy page trùng với page hiện tại */
    const PAGE = LIST.find(p => p.page_id === page_id)

    /** scroll xuống cuối trang */
    scrollToBottomMessage(messageStore.list_message_id)

    /**tạo id cho tin nhắn tạm */
    const TEMP_ID = uniqueId(text)

    /** Tìm tin nhắn đang được reply */
    const REPLY_MESSAGE = messageStore.list_message.find(
      m => m.message_mid === messageStore.reply_message?.message_id,
    )

    /** thêm vào danh sách tin nhắn tạm */
    messageStore.send_message_list.push({
      text,
      time: new Date().toISOString(),
      temp_id: TEMP_ID,
      replay_mid: messageStore.reply_message?.message_id,
      snap_replay_message: REPLY_MESSAGE,
    })

    try {
      /**gửi bình luận */
      const RES = await this.API_MESSAGE.sendReplyMessage(
        page_id,
        client_id,
        text,
        messageStore.reply_message?.message_id || '',
        PAGE?.org_id || '',
      )

      /** nếu có lỗi thì throw ra */
      if (get(RES, 'error')) {
        throw get(RES, 'error')
      }

      /** cập nhật id tin nhắn thật vào tin nhắn tạm */
      if (RES?.message_id) {
        messageStore.updateTempMessage(TEMP_ID, 'message_id', RES.message_id)
      }
    } catch (e) {
      /** đánh dấu tin nhắn tạm là có lỗi */
      messageStore.updateTempMessage(TEMP_ID, 'error', true)
      console.error('Lỗi khi gửi reply message:', e)
    }

    /** xoá dữ liệu trả lời */
    messageStore.clearReplyMessage()

    scrollToBottomMessage(messageStore.list_message_id)
  }
  /**gửi tin nhắn dạng văn bản */
  async sendText(
    page_id: string,
    client_id: string,
    text: string,
    input: HTMLDivElement,
    fb_uid?: string,
  ) {
    /** tính toán mentions */
    const MENTIONS = this.calcMentions(page_id, text)

    /** xoá dữ liệu trong input */
    this.clearInputText()

    /** xóa mapping mentions */
    $props.mention_ref?.clearMembersMap()

    /** scroll xuống cuối trang */
    scrollToBottomMessage(messageStore.list_message_id)

    /**tạo id cho tin nhắn tạm */
    const TEMP_ID = uniqueId(text)

    /** thêm vào danh sách tin nhắn tạm */
    messageStore.send_message_list.push({
      text,
      time: new Date().toISOString(),
      temp_id: TEMP_ID,
      mentions: MENTIONS,
    })

    // // xóa tin nhắn tạm sau 3 giây không thành công
    // messageStore.timer_clear_send_message_list.set(
    //   TEMP_ID,
    //   setTimeout(() => messageStore.removeTempMessage(TEMP_ID), 3000),
    // )

    try {
      /** gửi tin nhắn bằng api chính thống */
      const MESSAGE_ID = await new Promise<string>((resolve, reject) =>
        send_message(
          {
            page_id,
            client_id,
            text,
            mentions: MENTIONS,
            /** is_group: conversationStore.select_conversation?.is_group, */
          },
          (e, r) => {
            /** nếu có lỗi thì báo lỗi */
            if (e) return reject(e)
            /** nếu không có id tin nhắn thì báo lỗi */
            if (!r?.message_id) return reject(r)

            /** nếu có id tin nhắn thì trả về id */
            resolve(r?.message_id)
          },
        ),
      )

      // nếu đã có trong danh sách tin nhắn rồi thì xóa tin nhắn tạm
      if (messageStore.map_list_message_by_id.has(MESSAGE_ID)) {
        remove(messageStore.send_message_list, m => m.temp_id === TEMP_ID)
      }

      /** cập nhật id tin nhắn thật vào tin nhắn tạm */
      messageStore.updateTempMessage(TEMP_ID, 'message_id', MESSAGE_ID)
    } catch (e) {
      /** nếu không có ext hoặc không phải fb thì báo lỗi */
      if (
        commonStore.extension_status !== 'FOUND' ||
        conversationStore.select_conversation?.platform_type !== 'FB_MESS'
      ) {
        /** đánh dấu tin nhắn tạm là có lỗi */
        messageStore.updateTempMessage(TEMP_ID, 'error', true)

        /** xử lý thông báo lỗi */
        return this.handleSendMessageError(e)
      }

      /** nếu bật ext thì gửi lại 1 lần nữa */
      sendTextMesage(
        conversationStore.select_conversation?.platform_type,
        page_id,
        client_id,
        pageStore?.selected_page_list_info?.[page_id]?.page?.fb_page_token,
        // conversationStore.select_conversation?.client_bio?.fb_uid,
        fb_uid,
        text,
      )

      /** xoá tin nhắn tạm khỏi danh sách */
      messageStore.removeTempMessage(TEMP_ID)
    }
  }
  /**xóa dữ liệu của input chat */
  clearInputText() {
    /**input chat */
    const INPUT = document.getElementById('chat-text-input-message')

    /** xoá dữ liệu trong input */
    if (INPUT) INPUT.innerHTML = ''

    /** đánh dấu là input đã hết text */
    commonStore.is_typing = false
  }
  /**gửi tập tin */
  sendFile(page_id: string, client_id: string) {
    /** đánh dấu đang gửi file */
    messageStore.is_send_file = true

    /** cắt file gửi thành 2 loại */
    const [
      /**danh sách hình ảnh */
      IMAGE_LIST,
      /**danh sách file còn lại */
      FILE_LIST,
    ] = partition(messageStore.upload_file_list, file => file.type === 'image')

    waterfall(
      [
        /** * loop qua các file ảnh để upload lên server nếu cần */
        (cb: CbError) =>
          eachOfLimit(
            IMAGE_LIST,
            20,
            (file: UploadFile, i, next) => {
              file.is_loading = true

              /** đang gửi mà file bị xoá mất, hoặc đã có url rồi */
              if (!file || file.url) return next()

              /** file tự upload */
              this.getFileUrl(file?.source!, file?.file_name!, (e, r) => {
                if (r) file.url = r

                next()
              })
            },
            cb,
          ),
        /** * gửi các hình ảnh đã được upload */
        (cb: CbError) => {
          /** gửi ngang qua ext cho riêng luồng FB */
          if (
            commonStore.extension_status === 'FOUND' &&
            conversationStore.select_conversation?.platform_type === 'FB_MESS'
          ) {
            /** gắn cờ done */
            IMAGE_LIST.forEach(image => {
              image.is_loading = false
              image.is_done = true
            })

            /** gửi qua ext */
            sendImageMessage(
              conversationStore.select_conversation?.platform_type,
              page_id,
              client_id,
              pageStore?.selected_page_list_info?.[page_id]?.page
                ?.fb_page_token,
              conversationStore.select_conversation?.client_bio?.fb_uid,
              IMAGE_LIST.map(image => {
                return {
                  url: image.url as string,
                  fb_image_id: image.fb_image_id,
                  type: 'image',
                }
              }),
            )

            cb()
          } else
            /** gửi chính thống */
            eachOfLimit(
              IMAGE_LIST,
              20,
              (file: UploadFile, i, next) => {
                if (!file.url) return next()

                send_message(
                  {
                    page_id,
                    client_id,
                    attachment: { url: file.url, type: file.type },
                    /** is_group: conversationStore.select_conversation?.is_group, */
                  },
                  (e, r) => {
                    file.is_loading = false
                    file.is_done = true

                    next()
                  },
                )
              },
              cb,
            )
        },
        /** * loop qua các file còn lại */
        (cb: CbError) =>
          eachOfLimit(
            FILE_LIST,
            20,
            (file: UploadFile, i, next) => {
              /** đang gửi mà file bị xoá mất */
              if (!file) return next()

              file.is_loading = true
              /**link file */
              let url: string
              waterfall(
                [
                  /** lấy link của file */
                  (_cb: CbError) => {
                    /** file từ album */
                    if (file.url) {
                      url = file.url

                      return _cb()
                    }

                    /** file tự upload */
                    this.getFileUrl(file?.source!, file?.file_name!, (e, r) => {
                      if (e) return _cb(e)

                      if (r) url = r
                      _cb()
                    })
                  },
                  /** * gửi file lên fb */
                  (_cb: CbError) =>
                    send_message(
                      {
                        page_id,
                        client_id,
                        attachment: { url: url, type: file.type },
                        /** is_group: conversationStore.select_conversation?.is_group, */
                      },
                      (e, r) => {
                        if (e) return _cb('DONE')

                        _cb()
                      },
                    ),
                ],
                e => {
                  file.is_loading = false
                  file.is_done = true

                  next()
                },
              )
            },
            cb,
          ),
      ],
      e => {
        /** reset upload */
        setTimeout(() => {
          /** làm mới list file */
          messageStore.upload_file_list = []

          /** đã gửi xong */
          messageStore.is_send_file = false
        }, 500)
      },
    )
  }

  /** gửi tập tin */
  sendFileHorizontal(
    page_id: string,
    client_id: string,
    select_conversation?: ConversationInfo,
    selected_page_list_info?: PageList,
    fb_uid?: string,
  ) {
    /** đánh dấu đang gửi file */
    messageStore.is_send_file = true

    /** cắt file gửi thành 2 loại */
    const [IMAGE_LIST, FILE_LIST] = partition(
      messageStore.upload_file_list,
      file => file.type === 'image',
    )

    waterfall(
      [
        /** Upload ảnh lên server nếu cần */
        (cb: CbError) =>
          eachOfLimit(
            IMAGE_LIST,
            20,
            (file: UploadFile, i, next) => {
              /** Nếu file bị xoá hoặc đã có url sẵn (từ album) → không cần upload */
              if (!file || file.url) return next()

              /** Chỉ bật loading cho ảnh cần upload */
              file.is_loading = true

              /** Upload file để lấy url */
              this.getFileUrl(file?.source!, file?.file_name!, (e, r) => {
                /** Tắt loading sau khi upload xong */
                file.is_loading = false
                /** Gán URL nếu thành công */
                if (r) file.url = r
                next()
              })
            },
            cb,
          ),

        /** Gửi ảnh sau khi upload xong */
        (cb: CbError) => {
          /** Nếu là gửi qua extension của FB */
          if (
            commonStore.extension_status === 'FOUND' &&
            conversationStore.select_conversation?.platform_type === 'FB_MESS'
          ) {
            //

            /** Gom tất cả ảnh có URL */
            const ATTACHMENTS = IMAGE_LIST.filter(f => f.url).map(file => ({
              url: file.url as string,
              type: file.type,
            }))

            // Nếu không có ảnh nào hợp lệ => bỏ qua
            if (!ATTACHMENTS.length) return cb()

            // Phát tín hiệu kèm đúng client_id được scope lúc bắt đầu gửi (tránh delay từ phía ext)
            dispatchEventBus('chatbox_ext_upload_start', client_id)

            // Gửi ảnh qua extension
            sendImageMessage(
              select_conversation?.platform_type,
              page_id,
              client_id,
              selected_page_list_info?.[page_id]?.page?.fb_page_token,
              // select_conversation?.client_bio?.fb_uid,
              fb_uid,
              IMAGE_LIST.map(image => ({
                url: image.url as string,
                fb_image_id: image.fb_image_id,
                type: 'image',
              })),
            )
            // Đánh dấu ảnh đã gửi
            IMAGE_LIST.forEach(image => {
              image.is_loading = false
              image.is_done = true
            })

            cb()
            // Tính kích thước ảnh
            // Promise.all(
            //   ATTACHMENTS.map((f, i) => {
            //     if (f.type !== 'image') return Promise.resolve(null)
            //     return getImageSize(IMAGE_LIST[i].id)
            //   }),
            // ).then(ATTACHMENT_SIZES => {
            //   // kiểm tra xem có đúng là khách đang chọn không, nếu có thì mới thêm vào danh sách tạm
            //   if(this.checkPageAndClient({page_id, client_id})) {
            //     /** Push 1 temp message chứa tất cả ảnh */
            //     const TEMP_ID = uniqueId(Date.now().toString())
            //     // Thêm temp message vào list
            //     messageStore.send_message_list.push({
            //       text: '',
            //       time: new Date().toISOString(),
            //       temp_id: TEMP_ID,
            //       message_attachments: ATTACHMENTS,
            //       attachment_size: ATTACHMENT_SIZES,
            //     })

            //     // Khi socket về thì ảnh bị chớp,
            //     // do socket thay lại link ảnh/ hiện tại dùng ảnh local
            //     // Scroll đến cuối tin nhắn
            //     scrollToBottomMessage(messageStore.list_message_id)
            //   }

            // })
          } else {
            /** === GỬI CHÍNH THỐNG === */

            /** ✅ Gom tất cả ảnh có URL */
            const ATTACHMENTS = IMAGE_LIST.filter(f => f.url).map(file => ({
              url: file.url as string,
              type: file.type,
            }))

            /** Nếu không có ảnh nào hợp lệ => bỏ qua */
            if (!ATTACHMENTS.length) return cb()

            /** Kiểm tra có phải FB_MESS hoặc FB_INSTAGRAM không */
            const IS_FB_OR_IG = ['FB_MESS', 'FB_INSTAGRAM'].includes(
              platform_type.value || '',
            )

            /** Tính kích thước thực tế từng ảnh TRƯỚC khi push temp message */
            Promise.all(
              ATTACHMENTS.map((f, i) => {
                /** Nếu không phải ảnh thì trả về null */
                if (f.type !== 'image') return Promise.resolve(null)
                /** Lấy kích thước thực tế từ URL */
                return getImageSize(IMAGE_LIST[i].id)
              }),
            ).then(ATTACHMENT_SIZES => {
              /** Các tin nhắn gửi ảnh sẽ gửi đi */
              const IMAGE_MESSAGE_LIST: {
                temp_id: string
                attachments: { url: string; type: UploadFile['type'] }[]
              }[] = []

              // kiểm tra xem có đúng là khách đang chọn không, nếu có thì mới thêm vào danh sách tạm
              if (this.checkPageAndClient({ page_id, client_id })) {
                /**
                 * FB_MESS/FB_INSTAGRAM: push 1 temp message chứa nhiều ảnh (vì FB/IG giữ nguyên 1 message)
                 * Các platform khác: push nhiều temp message riêng (vì socket sẽ tách thành nhiều tin)
                 */
                if (IS_FB_OR_IG) {
                  /** Tạo temp_id cho tin nhắn tạm */
                  const TEMP_ID = uniqueId(Date.now().toString())
                  /** Push 1 temp message chứa tất cả ảnh */
                  messageStore.send_message_list.push({
                    text: '',
                    time: new Date().toISOString(),
                    temp_id: TEMP_ID,
                    message_attachments: ATTACHMENTS,
                    attachment_size: ATTACHMENT_SIZES,
                  })

                  // lưu lại temp_id và danh sách ảnh để khi api trả dữ liệu về dựa vào temp_id map message_id và danh sách tin nhắn chờ
                  IMAGE_MESSAGE_LIST.push({
                    temp_id: TEMP_ID,
                    attachments: ATTACHMENTS,
                  })
                } else {
                  /** Push nhiều temp message riêng, mỗi message 1 ảnh */
                  ATTACHMENTS.forEach((attachment, index) => {
                    /** Tạo temp_id riêng cho từng message */
                    const TEMP_ID = uniqueId(`${Date.now()}_${index}`)
                    /** Push temp message với 1 ảnh */
                    messageStore.send_message_list.push({
                      text: '',
                      time: new Date().toISOString(),
                      temp_id: TEMP_ID,
                      message_attachments: [attachment],
                      attachment_size: [ATTACHMENT_SIZES[index]],
                    })

                    // lưu lại temp_id và danh sách ảnh để khi api trả dữ liệu về dựa vào temp_id map message_id và danh sách tin nhắn chờ
                    IMAGE_MESSAGE_LIST.push({
                      temp_id: TEMP_ID,
                      attachments: [attachment],
                    })
                  })
                }

                /** Clear preview ngay sau khi push temp message */
                // messageStore.upload_file_list = []

                /** Scroll xuống bottom để thấy temp message */
                scrollToBottomMessage(messageStore.list_message_id)
              }

              eachOfLimit(
                IMAGE_MESSAGE_LIST,
                20,
                async (data: {
                  temp_id: string
                  attachments: { url: string; type: UploadFile['type'] }[]
                }) => {
                  /** Gửi API */
                  send_message(
                    {
                      page_id,
                      client_id,
                      attachments: data.attachments,
                      /** is_group: conversationStore.select_conversation?.is_group, */
                    },
                    (e, r) => {
                      /** cập nhật lại list ảnh  */
                      IMAGE_LIST.forEach(file => {
                        file.is_loading = false
                        file.is_done = true
                      })

                      if (!this.checkPageAndClient({ page_id, client_id }))
                        return

                      /** tìm kiếm tin nhắn tạm có id giống với temp_id và cập nhật message_id */
                      messageStore.send_message_list?.forEach(msg => {
                        // nếu không trùng temp_id thì return
                        if (msg.temp_id !== data.temp_id) return
                        
                        // nếu không có lỗi thì lưu lại message_id
                        if(!e) {
                          // nếu không có message_id thì xóa
                          // xử lý case gửi ảnh ngang và gửi ảnh fb webp
                          if (!r.message_id) {
                            messageStore.send_message_list = messageStore.send_message_list.filter(
                              m => m.temp_id !== msg.temp_id,
                            )
                            return
                          }
                          // nếu có thì lưu lại
                          msg.message_id = r.message_id
                        }
                        // nếu có lỗi thì đánh dấu cờ
                        else {
                          msg.error = true
                          /** xử lý thông báo lỗi */
                          this.handleSendMessageError(e)
                        }
                      })
                    },
                  )
                },
              )

              // chạy tiếp logic chứ không đợi api gửi tin nhắn
              cb()
            })
          }
        },

        (cb: CbError) => {
          // nếu có file thì xóa các ảnh trong danh sách file upload
          if (FILE_LIST?.length) {
            messageStore.upload_file_list = FILE_LIST
          }

          cb()
        },

        /** Upload & gửi các file còn lại */
        (cb: CbError) =>
          eachOfLimit(
            FILE_LIST,
            20,
            (file: UploadFile, i, next) => {
              /** Nếu k có file thì bỏ qua */
              if (!file) return next()
              /** Bật loading */
              file.is_loading = true
              /** Khai báo url */
              let url: string

              waterfall(
                [
                  /** Upload file lấy link */
                  (_cb: CbError) => {
                    if (file.url) {
                      url = file.url
                      return _cb()
                    }
                    /** lấy  */
                    this.getFileUrl(file?.source!, file.file_name!, (e, r) => {
                      if (e) {
                        /** xử lý thông báo lỗi */
                        this.handleSendMessageError(e)
                        _cb(e)
                      }
                      if (r) url = r
                      _cb()
                    })
                  },

                  /** Gửi file */
                  (_cb: CbError) =>
                    send_message(
                      {
                        page_id,
                        client_id,
                        attachment: { url, type: file.type },
                        /** is_group: conversationStore.select_conversation?.is_group, */
                      },
                      (e, r) => {
                        /** Kiểm tra lỗi  */
                        if (e) {
                          /** xử lý thông báo lỗi */
                          this.handleSendMessageError(e)
                        }
                        if (e) return _cb('DONE')
                        _cb()
                      },
                    ),
                ],
                () => {
                  file.is_loading = false
                  file.is_done = true
                  next()
                },
              )
            },
            cb,
          ),
      ],
      () => {
        /** reset upload */
        setTimeout(() => {
          messageStore.upload_file_list = []
          messageStore.is_send_file = false
        }, 500)
      },
    )
  }

  /** hàm kiểm tra xem có đúng là page và khách hiện tại không */
  checkPageAndClient(data: { page_id: string; client_id: string }) {
    return data.page_id === page_id.value && data.client_id === client_id.value
  }

  /**xử lý báo lỗi khi gửi tin nhắn thất bại */
  handleSendMessageError(error: any) {
    console.log(error);
    
    if (error?.error === -224)
      return toastError(
        $t(
          'gói Zalo OA của bạn đã hết hạn, bạn cần phải gia hạn để hệ thống có quyền gửi tin nhắn',
        ),
      )

    // nếu là file vượt quá dung lượng
    if(error.code === 'LIMIT_FILE_SIZE') {
      toastError($t('File vượt quá dung lượng cho phép'))
      return
    }
    // nếu là yêu cầu tài khoản tiktok business thì báo lỗi
    if (error === 'REQUIRE_BUSINESS_ACCOUNT')
      return toastError(
        $t('Vui lòng chuyển sang tài khoản TikTok Business'),
      )

    switch (get(error, 'error.code')) {
      case 10:
        toastError($t('v1.view.main.dashboard.chat.facebook_errors.10'))
        break
      case 551:
        toastError($t('v1.view.main.dashboard.chat.facebook_errors.551'))
        break
      case 100:
        toastError($t('v1.view.main.dashboard.chat.facebook_errors.100'))
        break
      case 190:
        facebook_error.value = get(error, 'error')
        facebook_error_ref.value?.toggleModal()
        break
      default:
        toastError(error)
        break
    }
  }
  /**upload file lên server để lấy link tạm thời */
  async getFileUrl(
    source: File,
    file_name: string,
    proceed: Cb<string>,
  ): Promise<void> {
    try {
      /** nếu không có id trang thì thôi */
      if (!page_id.value) return

      /** loại riêng cho zalo oa file khác hình ảnh */
      if (
        platform_type.value === 'ZALO_OA' &&
        !source.type?.includes('image')
      ) {
        /**kết quả upload */
        const RES = await new N6StaticAppUploadFile(page_id.value).uploadTempFile(
          'ZALO_FILE',
          source,
        )

        /** trả về kết quả upload */
        proceed(null, RES?.url)
        return
      }

      /** Đối tượng query api */
      const $N6_STATIC_V2 = new N6StaticAppUploadFileV2()
      /** kết quả lấy dữ liệu để upload ảnh */
      const RES = await $N6_STATIC_V2.getUploadTempFileUrl({
        file_name,
        content_type: source.type,
      })
      /** link file */
      const FILE_URL = RES.file_url
      /** link upload */
      const UPLOAD_URL = RES.upload_url

      /** dữ liệu file up lên */
      let file: File | Blob | null = null

      // nếu là file hình ảnh
      if (source.type?.includes('image')) {
        /** Ảnh sau khi resize */
        const IMG = await resizeImage({
          file: source,
          max_size: 1000,
          quality: 1,
          type: source.type,
        })

        /** dữ liệu file hình ảnh */
        file = IMG.blob!
      } else {
        /** dữ liệu file khác hình ảnh */
        file = source
      }

      // call api upload ảnh tạm
      await $N6_STATIC_V2.uploadTempFile({
        file,
        upload_url: UPLOAD_URL,
      })

      /** trả về kết quả upload */
      proceed(null, FILE_URL)
    } catch (e) {
      /** báo lỗi nếu có */
      proceed(e)
    }
  }
}
const $main = new Main()

defineExpose({ input_chat_ref, sendMessage: $main.sendMessage.bind($main) })
</script>
