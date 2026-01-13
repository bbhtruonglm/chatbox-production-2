<template>
  <div
    id="conversation__full-post"
    class="p-1 flex h-full overflow-hidden overflow-y-auto bg-[#0015810f] rounded-b-xl justify-center relative"
  >
    <div
      v-if="is_loading"
      class="relative z-10"
    >
      <div class="fixed left-1/2 -translate-x-1/2">
        <Loading class="mx-auto" />
      </div>
    </div>
    <div
      class="w-full max-w-[430px] h-fit bg-white rounded-lg flex flex-col py-2 border"
    >
      <div class="px-3 flex items-center gap-3">
        <PageAvatar
          :page_info="conversationStore.getPage()"
          class="size-8 border rounded-full flex-shrink-0"
        />
        <div class="flex-grow flex flex-col">
          <div class="flex items-center justify-between">
            <h1 class="font-semibold text-sm">
              {{ conversationStore.getPage()?.name }}
            </h1>
            <!-- Moved to bottom -->
          </div>
          <span class="text-xs">
            {{ $t('Người đăng') }}:
            <span class="font-medium">{{ creator_name }}</span>
          </span>
        </div>
      </div>
      <div class="py-2 px-3 text-xs">
        <span
          class="whitespace-pre-line"
          :class="{
            'line-clamp-5': !is_expanded,
          }"
        >
          {{ conversationStore.select_conversation_post?.content?.message }}
        </span>
        <span
          v-if="is_long_content"
          @click="is_expanded = !is_expanded"
          class="font-bold cursor-pointer hover:underline text-black block mt-1"
        >
          {{ is_expanded ? $t('Thu gọn') : $t('Xem thêm') }}
        </span>
        <div class="flex items-center justify-end gap-3 mt-2">
          <button
            @click="$main.filterByPost()"
            class="text-blue-700 flex items-center gap-1 hover:underline"
          >
            {{ $t('Lọc theo bài viết') }}
            <FunnelIcon class="size-3" />
          </button>
          <button
            @click="$post_service.openCommentOnFb(post_id)"
            class="text-blue-700 flex items-center gap-1 hover:underline"
          >
            {{ $t('Xem trên Facebook') }}
            <ArrowTopRightOnSquareIcon class="size-3" />
          </button>
        </div>
      </div>
      <img
        v-if="
          conversationStore.select_conversation_post?.content?.attachments
            ?.data?.[0]?.media?.image?.src
        "
        :src="$cdn.fbPostImg(page_id, post_id)"
        class="w-full border-y"
      />
      <!-- <p class="py-2 px-3 bg-slate-100 font-semibold text-base">
        Tặng ngay gói 1 Tháng trị giá 500.000đ chỉ với 50.000đ
      </p> -->
      <div class="py-1 px-3 text-sm grid grid-cols-3 gap-2.5">
        <span>
          {{ $t('Reaction') }}:
          <span class="font-medium">
            {{ $format.numberToString(total_reaction, true) }}
          </span>
        </span>
        <span>
          {{ $t('Bình luận') }}:
          <span class="font-medium">
            {{ $format.numberToString(analytic?.total_comment, true) }}
          </span>
        </span>
        <span>
          {{ $t('Chia sẻ') }}:
          <span class="font-medium">
            {{ $format.numberToString(analytic?.total_share, true) }}
          </span>
        </span>
      </div>

      <div
        v-if="post_id"
        class="overflow-y-auto flex flex-col gap-3"
      >
        <CommentItem
          v-for="(comment, comment_index) in post_comments"
          :key="comment.comment_id"
          v-model:main_loading="is_loading"
          :post_id
          :comment
          :comment_index
          class="px-3"
        />
        <LoadMoreBtn
          v-if="!done_load_comment"
          @click="$main.getFbPostComments()"
          class="pl-3"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConversationStore } from '@/stores'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { container } from 'tsyringe'
import { N4SerivceAppPost } from '@/utils/api/N4Service/Post'
import { error } from '@/utils/decorator/Error'
import { loadingV2 } from '@/utils/decorator/Loading'
import { composableService } from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/service'
import { Cdn } from '@/utils/helper/Cdn'
import { sum } from 'lodash'
import { Format } from '@/utils/helper/Format'

import CommentItem from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/CommentModal/CommentItem.vue'
import PageAvatar from '@/components/Avatar/PageAvatar.vue'
import Loading from '@/components/Loading.vue'
import LoadMoreBtn from '@/views/ChatWarper/Chat/CenterContent/MessageList/PostTemplate/CommentModal/LoadMoreBtn.vue'

import type { FacebookCommentPost } from '@/service/interface/app/post'
import type { MessageInfo } from '@/service/interface/app/message'

import {
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline'

/**dữ liệu từ socket */
interface CustomEventMessage extends Event {
  detail?: MessageInfo
}

const { PostService } = composableService()

/** service xử lý bài viết */
const $post_service = container.resolve(PostService)
/** store hội thoại */
const conversationStore = useConversationStore()
/** helper xử lý đường dẫn ảnh, tài nguyên */
const $cdn = container.resolve(Cdn)
/** helper format dữ liệu */
const $format = container.resolve(Format)

/**giới hạn số bản ghi */
const LIMIT_RECORD = 3

/**đang tải dữ liệu */
const is_loading = ref<boolean>(false)
/** Comments trong bài post */
const post_comments = ref<FacebookCommentPost[]>([])
/** gắn cờ đã load hết bình luận chính */
const done_load_comment = ref<boolean>()
/**phân trang bình luận chính */
const skip_comment = ref(0)

/**id bài viết */
const post_id = computed(
  () => conversationStore.select_conversation?.fb_client_id
)
/**id page */
const page_id = computed(
  () => conversationStore.select_conversation?.fb_page_id
)

/**tên người tạo bài viết này */
const creator_name = computed(() =>
  $post_service.getCreatorName(conversationStore.select_conversation_post)
)
/**thống kê của bài viết */
const analytic = computed(
  () => conversationStore.select_conversation_post_analytic?.post_analytic_data
)
/**tổng số lượng reaction */
const total_reaction = computed(() => {
  return sum([
    analytic.value?.total_reaction_like,
    analytic.value?.total_reaction_love,
    analytic.value?.total_reaction_wow,
    analytic.value?.total_reaction_haha,
    analytic.value?.total_reaction_sorry,
    analytic.value?.total_reaction_anger,
  ])
})

/** Trạng thái mở rộng nội dung */
const is_expanded = ref(false)
/** Kiểm tra nội dung có dài không */
const is_long_content = computed(
  () =>
    (conversationStore.select_conversation_post?.content?.message?.length ||
      0) > 300
)

class Main {
  /**
   * @param API_POST api post service
   */
  constructor(
    private readonly API_POST = container.resolve(N4SerivceAppPost)
  ) {}
  /**đọc dữ liệu của bài post đại diện cho hội thoại này */
  @loadingV2(is_loading, 'value')
  @error()
  async getPostInfo() {
    // xác thực dữ liệu
    if (!page_id.value) return
    if (!post_id.value) return

    /**lấy dữ liệu bài post */
    conversationStore.select_conversation_post = await this.API_POST.getPost(
      page_id.value,
      post_id.value
    )
  }
  /** Lấy bình luận chính từ bài post của fb */
  @loadingV2(is_loading, 'value')
  @error()
  async getFbPostComments() {
    // xác thực dữ liệu
    if (!page_id.value || !post_id.value) return

    /**dữ liệu bình luận */
    const COMMENTS = await this.API_POST.getPostComment(
      page_id.value,
      post_id.value,
      skip_comment.value,
      LIMIT_RECORD
    )

    // kiểm tra xem đã load hết bình luận chưa
    if ((COMMENTS?.length || 0) < LIMIT_RECORD) done_load_comment.value = true

    // thêm dữ liệu vào mảng
    post_comments.value.push(...COMMENTS)

    // tăng số bản ghi
    skip_comment.value += LIMIT_RECORD
  }
  /**xoá dữ liệu cũ */
  clearData() {
    // xoá dữ liệu bài viết cũ
    conversationStore.select_conversation_post = undefined
    // xoá dữ liệu bình luận cũ
    post_comments.value = []
    // cờ đã load hết bình luận
    done_load_comment.value = false
    // phân trang bình luận
    skip_comment.value = 0
  }
  /**lấy dữ liệu cần thiết của bài viết */
  async getPostData() {
    // xoá dữ liệu cũ
    this.clearData()

    // lấy dữ liệu bài post
    await this.getPostInfo()

    // tự động load bình luận
    await this.getFbPostComments()
  }
  /**xử lý khi có bình luận mới ngoài luồng */
  socketNewMessage({ detail }: CustomEventMessage) {
    /**bình luận */
    const COMMENT = detail?.comment

    // nếu không có bình luận thì thoát
    if (!COMMENT) return

    // chỉ tính bình luận của bài post lớp ngoài cùng
    if (COMMENT?.parent_id !== post_id.value) return

    // thêm bình luận lên đầu mảng nếu chưa tồn tại
    if (
      !post_comments.value.find(item => item.comment_id === COMMENT.comment_id)
    )
      post_comments.value.unshift(COMMENT)
  }

  /**
   * Lọc hội thoại theo bài viết
   * - Chuyển sang tab CHAT
   * - Gắn post_id vào bộ lọc
   */
  filterByPost() {
    // nếu không có id bài viết thì không làm gì
    if (!post_id.value) return

    // cập nhật dữ liệu bộ lọc
    conversationStore.option_filter_page_data = {
      ...conversationStore.option_filter_page_data,
      conversation_type: 'CHAT',
      post_id: post_id.value,
    }
  }
}
const $main = new Main()

// lấy dữ liệu bài post khi component được tạo
onMounted(() => $main.getPostData())

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

// lấy dữ liệu bài post khi conversation thay đổi
watch(
  () => post_id.value,
  () => {
    // reset dữ liệu cũ
    $main.getPostData()
    // reset trạng thái mở rộng
    is_expanded.value = false
  }
)
</script>
