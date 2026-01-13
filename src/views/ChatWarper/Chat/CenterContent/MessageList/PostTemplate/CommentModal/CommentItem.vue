<template>
  <div class="flex gap-3">
    <PageAvatar
      v-if="is_from_page"
      :page_info="conversationStore.getPage()"
      class="w-10 h-10 flex-shrink-0"
    />
    <ClientAvatar
      v-else
      :conversation="conversationStore.select_conversation"
      :comment
      class="w-10 h-10 flex-shrink-0"
    />

    <div class="min-w-0 flex-grow flex flex-col gap-3">
      <div class="flex flex-col gap-0.5">
        <div
          class="rounded-xl bg-slate-100 py-1 px-2 text-sm flex flex-col gap-2"
        >
          <div>
            <div class="flex justify-between">
              <strong class="font-semibold">{{ comment?.from?.name }}</strong>
              <div class="flex items-center gap-2">
                <small class="text-slate-700">
                  {{
                    $date_handle.formatCompareCurrentYear(comment?.createdAt)
                  }}
                </small>
                <template v-if="emotion">
                  <LikeIcon
                    v-if="emotion === 'like'"
                    v-tooltip="$t('Thích')"
                    class="size-5"
                  />
                  <HahaIcon
                    v-else-if="emotion === 'happy'"
                    v-tooltip="$t('Vui vẻ')"
                    class="size-5"
                  />
                  <SadIcon
                    v-else-if="emotion === 'sad'"
                    v-tooltip="$t('Buồn')"
                    class="size-5"
                  />
                  <AngryIcon
                    v-else-if="emotion === 'angry'"
                    v-tooltip="$t('Giận dữ')"
                    class="size-5"
                  />
                </template>
              </div>
            </div>
            <p class="enter-line">{{ comment?.message }}</p>
          </div>
          <Action
            v-if="message_source?.list_button?.length"
            :list_button="message_source?.list_button"
            :ai="message_source?.ai"
            :comment_id="comment?._id"
            class="w-fit"
          />
        </div>
        <img
          v-if="comment?.photo"
          class="h-14 w-fit border rounded-xl"
          :src="
            $cdn.fbCommentMedia(
              conversationStore.select_conversation?.fb_page_id,
              comment.comment_id
            )
          "
        />
        <div class="font-medium text-sm flex items-center gap-5">
          <button @click="$main.focusInput({ type: 'REPLY' })">
            {{ $t('v1.view.main.dashboard.chat.post.reply_comment') }}
          </button>
          <button
            v-if="!is_from_page"
            @click="$main.toggleComment()"
          >
            {{ $t('v1.view.main.dashboard.chat.post.hide_comment') }}
          </button>
          <button
            v-if="!is_from_page && !comment?.is_private_reply"
            @click="$main.focusInput({ type: 'PRIVATE_REPLY' })"
          >
            {{ $t('v1.view.main.dashboard.chat.post.private_inbox') }}
          </button>
        </div>
      </div>

      <CommentItem
        v-for="(child_comment, child_index) in child_comments"
        :key="child_comment.comment_id"
        @focus_input="$event => $main.focusInput($event)"
        :post_id
        :comment="child_comment"
        :comment_index="child_index"
        is_child_comment
      />

      <LoadMoreBtn
        v-if="!is_child_comment && !is_done && !main_loading"
        @click="$main.getFbPostChildComments()"
        :count="0"
      />

      <div
        v-if="!is_child_comment && reply_type"
        class="flex relative"
      >
        <input
          v-model="reply_text"
          ref="ref_input"
          :placeholder="
            reply_type === 'REPLY'
              ? $t('Bình luận với vai trò _', {
                  name: conversationStore.getPage()?.name,
                })
              : $t('Gửi tin trả lời')
          "
          @keyup.enter="$main.sendMesage()"
          class="w-full py-3.5 px-5 pr-12 border rounded-full text-sm placeholder:text-slate-500"
        />
        <div class="absolute right-2 top-1/2 -translate-y-1/2">
          <ArrowUpCircleIcon
            v-if="!is_replying"
            @click="$main.sendMesage()"
            :class="
              reply_text?.trim()?.length ? 'text-black' : 'text-slate-500'
            "
            class="w-10 h-10 cursor-pointer"
          />
          <Loading
            v-if="is_replying"
            class=""
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useConversationStore } from '@/stores'
import { SingletonCdn } from '@/utils/helper/Cdn'
import { container } from 'tsyringe'
import { DateHandle } from '@/utils/helper/DateHandle'
import { N4SerivceAppPost } from '@/utils/api/N4Service/Post'
import { error } from '@/utils/decorator/Error'
import { loadingV2 } from '@/utils/decorator/Loading'
import { useI18n } from 'vue-i18n'
import { composableService } from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/service'
import { composableService as composableServiceMessage } from '@/views/ChatWarper/Chat/CenterContent/MessageList/service'

import Action from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/MessageTemplate/Action.vue'
import CommentItem from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/CommentModal/CommentItem.vue'
import ClientAvatar from '@/components/Avatar/ClientAvatar.vue'
import PageAvatar from '@/components/Avatar/PageAvatar.vue'
import LoadMoreBtn from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/CommentModal/LoadMoreBtn.vue'
import Loading from '@/components/Loading.vue'

import LikeIcon from '@/components/Icons/Like.vue'
import HahaIcon from '@/components/Icons/Haha.vue'
import SadIcon from '@/components/Icons/Sad.vue'
import AngryIcon from '@/components/Icons/Angry.vue'
import { ArrowUpCircleIcon } from '@heroicons/vue/24/solid'

import type { FacebookCommentPost } from '@/service/interface/app/post'
import type {
  IReplyCommentType,
  MessageInfo,
  MessageTemplateInput,
} from '@/service/interface/app/message'
import type { IAlert } from '@/utils/helper/Alert/type'

/**dữ liệu của sự kiện focus */
interface IFocusInputPayload {
  /**loại trả lời */
  type: IReplyCommentType
  /**id của bình luận con */
  comment_id?: string
}
/**dữ liệu từ socket */
interface CustomEvent extends Event {
  /**bình luận */
  detail?: FacebookCommentPost
}
/**dữ liệu từ socket */
interface CustomEventMessage extends Event {
  detail?: MessageInfo
}

const { ToastReplyComment } = composableService()
const { MessageService } = composableServiceMessage()

/**loading của bài post */
const main_loading = defineModel('main_loading')

const $emit = defineEmits(['focus_input'])
const $props = withDefaults(
  defineProps<{
    /**id của bài post */
    post_id: string

    /**dữ liệu của bình luận này */
    comment: FacebookCommentPost
    /**vị trí của bình luận này */
    comment_index: number

    /**không hiện btn xem thêm - vì là comemnt lớp con */
    is_child_comment?: boolean
  }>(),
  {}
)

const $mesage_service = container.resolve(MessageService)
const conversationStore = useConversationStore()
const $cdn = SingletonCdn.getInst()
const $date_handle = container.resolve(DateHandle)
const { t: $t } = useI18n()

/**giới hạn số bản ghi */
const LIMIT_RECORD = 3

/**nội dung trả lời bình luận */
const reply_text = ref<string>()
/**có đang trả lời bình luận không */
const is_replying = ref(false)
/**Ref của input trả lời bình luận */
const ref_input = ref<HTMLInputElement>()
/**loại trả lời bình luận */
const reply_type = ref<IReplyCommentType>()
/**id của bình luận con được chọn */
const select_child_comment_id = ref<string>()
/**phân trang: bình luận con */
const skip = ref<number>(0)
/**đã hết bình luận con */
const is_done = ref<boolean>()
/**dữ liệu bình luận con của bình luận này */
const child_comments = ref<FacebookCommentPost[]>([])

/**id của page */
const page_id = computed(
  () => conversationStore.select_conversation?.fb_page_id
)
/**id của client */
const client_id = computed(
  () => conversationStore.select_conversation?.fb_client_id
)
/**có phải từ page không */
const is_from_page = computed(() => page_id.value === $props.comment?.from?.id)
/**cảm xúc của bình luận này */
const emotion = computed(() => $props.comment?.ai?.[0]?.emotion)
/**dữ liệu nhắn tin nâng cao của bình luận này */
const message_source = computed<MessageTemplateInput>(
  () =>
    $mesage_service.genMessageSource(
      $props.comment?.ai,
      $props.comment?.message_attachments
    )?.[0]
)

class Main {
  /**
   * @param API_POST API của bài post
   * @param SERVICE_TOAST thông báo
   */
  constructor(
    private readonly API_POST = container.resolve(N4SerivceAppPost),
    private readonly SERVICE_TOAST: IAlert = container.resolve(
      ToastReplyComment
    )
  ) {}

  /**ẩn hiện bình luận */
  @loadingV2(main_loading, 'value')
  @error(container.resolve(ToastReplyComment))
  async toggleComment() {
    // kiểm tra dữ liệu
    if (!page_id.value) return
    if (!client_id.value) return

    // ẩn hiện bình luận
    await this.API_POST.toggleComment(
      page_id.value,
      client_id.value,
      $props.post_id,
      $props.comment.comment_id,
      true
    )

    // thông báo thành công
    this.SERVICE_TOAST.success($t('Đã ẩn bình luận'))
  }
  /** Lấy bình luận phụ từ bình luận chính của fb */
  @loadingV2(main_loading, 'value', false)
  @error()
  async getFbPostChildComments() {
    // kiểm tra dữ liệu
    if (!page_id.value) return
    // if (!client_id.value) return
    if (!$props.comment?.comment_id) return

    /**dữ liệu bình luận con */
    const COMMENTS = await this.API_POST.getChildComment(
      page_id.value,
      // client_id.value,
      $props.comment?.comment_id,
      skip.value,
      LIMIT_RECORD
    )

    // nếu hết, hoặc ít hơn limit thì báo là đã hết dữ liệu
    if ((COMMENTS?.length || 0) < LIMIT_RECORD) is_done.value = true

    // thêm vào mảng bình luận con
    child_comments.value?.push(...COMMENTS)

    // tăng số lượng bản ghi đã lấy
    skip.value += LIMIT_RECORD
  }
  /**gửi tin nhắn trả lời */
  sendMesage() {
    /**id của bình luận được chọn */
    const COMMENT_ID =
      select_child_comment_id.value || $props.comment?.comment_id

    // kiểm tra dữ liệu
    if (!COMMENT_ID) return
    if (!reply_text.value) return
    if (!page_id.value) return
    if (!client_id.value) return

    // gửi tin nhắn theo từng loại
    switch (reply_type.value) {
      case 'REPLY':
        this.replyComment(page_id.value, COMMENT_ID, reply_text.value)
        break
      case 'PRIVATE_REPLY':
        this.privateReplyComment(
          page_id.value,
          client_id.value,
          COMMENT_ID,
          reply_text.value
        )
        break
    }
  }
  /**trả lời bình luận */
  @loadingV2(is_replying, 'value')
  @error()
  async replyComment(page_id: string, comment_id: string, text: string) {
    /**kết quả */
    const RES = await this.API_POST.sendComment(page_id, comment_id, text)

    // thêm  vào mảng bình luận
    child_comments.value?.unshift({
      comment_id: RES?.id || '',
      from: {
        id: page_id,
        name: conversationStore.getPage()?.name,
      },
      message: text,
      createdAt: new Date().toLocaleString(),
    })

    // làm sạch dữ liệu input
    this.clearInput()

    // thông báo thành công
    this.SERVICE_TOAST.success($t('Đã trả lời bình luận'))
  }
  /**gửi tin nhắn bí mật */
  @loadingV2(is_replying, 'value')
  @error(container.resolve(ToastReplyComment))
  async privateReplyComment(
    page_id: string,
    client_id: string,
    comment_id: string,
    text: string
  ) {
    // gửi tin nhắn private
    await this.API_POST.sendPrivateReply(
      page_id,
      client_id,
      $props.post_id,
      comment_id,
      text
    )

    // đánh dấu là đã trả lời riêng
    $props.comment.is_private_reply = true

    // làm sạch dữ liệu input
    this.clearInput()

    // thông báo thành công
    this.SERVICE_TOAST.success($t('Đã gửi tin nhắn trả lời'))
  }
  /**làm sạch dữ liệu input sau khi xong */
  clearInput() {
    // xóa nội dung trả lời
    reply_text.value = undefined
    // xóa id bình luận con được chọn
    select_child_comment_id.value = undefined
    // ẩn input
    reply_type.value = undefined
  }
  /** Focus vào input của bình luận */
  async focusInput({ type, comment_id }: IFocusInputPayload) {
    // nếu là bình luận con thì focus vào input cha
    if ($props.is_child_comment)
      return $emit('focus_input', {
        type,
        comment_id: $props.comment?.comment_id,
      })

    // nếu là bình luận cha

    // lưu id bình luận con được chọn nếu có
    if (comment_id) select_child_comment_id.value = comment_id

    // gắn cờ loại trả lời
    reply_type.value = type

    // chờ vue render xong
    await nextTick()

    // focus vào input
    ref_input.value?.focus()
  }
  /**cập nhật bình luận khi có socket */
  socketUpdateComment({ detail }: CustomEvent) {
    // nếu không có dữ liệu thì thoát
    if (!detail) return

    // nếu không phải bình luận này thì thoát
    if ($props.comment?.comment_id !== detail?.comment_id) return

    // nạp dữ liệu mới của AI
    $props.comment.ai = detail.ai
    $props.comment.message_attachments = detail.message_attachments
  }
  /**xử lý khi có bình luận mới ngoài luồng */
  async socketNewMessage({ detail }: CustomEventMessage) {
    await nextTick()
    /**bình luận */
    const COMMENT = detail?.comment

    // nếu không có bình luận thì thoát
    if (!COMMENT) return

    if (COMMENT?.parent_id !== $props.comment?.comment_id) return

    // bỏ qua bình luận của bài post lớp ngoài cùng
    if (COMMENT?.parent_id === $props.comment?.post_id) return
    // nếu là bình luận cha thì thoát
    if ($props.comment?.parent_id === COMMENT?.comment_id) return

    // nếu là chính bình luận này thì thoát
    if ($props.comment?.comment_id === COMMENT?.comment_id) return

    // thêm bình luận lên đầu mảng nếu chưa tồn tại
    if (
      !child_comments.value.find(item => item.comment_id === COMMENT.comment_id)
    )
      child_comments.value.unshift(COMMENT)
  }
}
const $main = new Main()

// tự động lấy bình luận con khi mở modal
onMounted(() => $main.getFbPostChildComments())

// lắng nghe sự kiện từ socket khi component được tạo ra
onMounted(() => {
  // cập nhật tin nhắn
  window.addEventListener(
    'chatbox_socket_update_comment',
    $main.socketUpdateComment.bind($main)
  )
})

// hủy lắng nghe sự kiện từ socket khi component bị hủy
onUnmounted(() => {
  // cập nhật tin nhắn
  window.removeEventListener(
    'chatbox_socket_update_comment',
    $main.socketUpdateComment.bind($main)
  )
})

// lắng nghe sự kiện từ socket khi component được tạo ra
onMounted(() => {
  // tin nhắn mới
  window.addEventListener(
    'chatbox_socket_message',
    $main.socketNewMessage.bind($main)
  )
})

// hủy lắng nghe sự kiện từ socket khi component bị hủy
onUnmounted(() => {
  // tin nhắn mới
  window.removeEventListener(
    'chatbox_socket_message',
    $main.socketNewMessage.bind($main)
  )
})
</script>
<style lang="scss" scoped>
@import '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/style.scss';
</style>
