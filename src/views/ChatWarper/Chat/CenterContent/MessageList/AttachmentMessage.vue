<template>
  <div
    :class="{ 'justify-end': type === 'PAGE' }"
    class="p-2 bg-white rounded-lg flex flex-col gap-2"
  >
    <div class="flex gap-2 justify-between">
      
      <div class="flex flex-wrap relative z-1 gap-2">
        <template v-for="(attachment, index) of message?.message_attachments">
          <div
            @click="$main.viewAttachment(index)"
            class="cursor-pointer hover:brightness-90 rounded-lg bg-gray-50 overflow-hidden"
            :style="
              $main.initSize(
                message?.attachment_size?.[index]?.width,
                message?.attachment_size?.[index]?.height
              )
            "
          >
            <img
              :src="
                isUseNewCdn()
                  ? getCdnUrl(index) ||
                    message?.message_attachments?.[index]?.payload?.url
                  : message?.message_attachments?.[index]?.payload?.url
              "
              :class="is_reply ? 'object-cover' : 'object-contain'"
              class="w-full h-full"
            />
          </div>
          
        </template>
        <div
          ref="ref_message_content"
          class="enter-line"
          :class="{
            'overflow-hidden': !is_view_full,
          }"
          :style="{
            'max-height': is_view_full ? 'unset' : `${MAX_HEIGHT_CONTENT}px`,
          }"
          v-if="message?.message_text"
          v-html="fixXss($markdown.render(renderTextV2(message?.message_text)))"
          @click="clickCopyPhoneEmail"
          />
          <p
            v-if="
              ((!is_view_full && ref_message_content?.clientHeight) || 0) >=
              MAX_HEIGHT_CONTENT
            "
            @click="is_view_full = true"
          >
            ...
            <span class="text-blue-500 cursor-pointer">{{ $t('Xem thêm') }} </span>
          </p>
          <p
            v-if="is_view_full"
            @click="is_view_full = false"
          >
            <span class="text-blue-500 cursor-pointer">{{ $t('Thu gọn') }} </span>
          </p>
      </div>
    </div>
    <MediaDetail
      ref="media_detail_ref"
      :data_source
      :message_id="message?._id"
      :message
      :index="selected_item_index"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

import MediaDetail from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/MediaDetail.vue'
import DOMPurify from 'dompurify'
import type {
  MessageInfo,
  MessageTemplateInput,
} from '@/service/interface/app/message'
import { FitSize } from '@/utils/helper/Attachment'
import { SingletonCdn } from '@/utils/helper/Cdn'
import { CreateDataSource, type ICreateDataSource } from './CreateDataSource'
import { container } from 'tsyringe'
import { useConversationStore } from '@/stores'
import { clickCopyPhoneEmail, renderTextV2 } from '@/service/function'
import { MarkedService } from '@/utils/helper/Markdown'
/** service render markdown */
const $markdown = container.resolve(MarkedService)


/** chiều cao tối đa cho nội dung khi ở mặc định */
const MAX_HEIGHT_CONTENT = 160

const $props = withDefaults(
  defineProps<{
    /**dữ liệu của tin nhắn */
    message: MessageInfo
    /**được gửi từ đâu */
    type: 'CLIENT' | 'PAGE'
    /**có phải là tin nhắn trả lời không */
    is_reply?: boolean
  }>(),
  {}
)

const $cdn = SingletonCdn.getInst()
/** store quản lý hội thoại */
const conversationStore = useConversationStore()

/**ref của component MediaDetail */
const media_detail_ref = ref<InstanceType<typeof MediaDetail>>()
/**dữ liệu của tin nhắn đã được format sang dạng mới */
const data_source = ref<MessageTemplateInput>({})
/**index của phần tử được chọn */
const selected_item_index = ref<number>()

/**
 * loại nền tảng
 * ưu tiên platform_type của tin nhắn, nếu không có thì fallback platform_type của hội thoại
 */
const platform_type = computed(
  () =>
    $props.message?.platform_type ||
    conversationStore.select_conversation?.platform_type
)
/**
 * có hiển thị content không
 * - nếu có cờ AI thì tự động không hiển thị
 * - nếu không có AI thì luôn hiển thị
 */
// const is_expanded = ref(!$props.data_source?.is_ai)

/** tham chiếu tới phần tử hiển thị content */
const ref_message_content = ref<HTMLElement | null>(null)

/** cờ check xem hết nội dung nếu nội dung quá dài */
const is_view_full = ref(false)

/**có sử dụng cnd mới không */
function isUseNewCdn() {
  // các nền tảng sử dụng cdn mới
  return [
    'FB_MESS',
    'WEBSITE',
    'FB_INSTAGRAM',
    'TIKTOK',
    'ZALO_OA',
    'ZALO_PERSONAL',
  ].includes(platform_type.value || '')
}

/**
 * Lấy CDN URL dựa trên platform_type
 * @param {number} index - index của file đính kèm
 * @returns {string | undefined} - URL của file đính kèm
 */
function getCdnUrl(index: number): string | undefined {
  /** lấy id của tin nhắn */
  const TARGET_ID = $props.message?.message_mid
  /** nếu không có id thì không cần xử lý */
  if (!TARGET_ID) return

  /** nếu là WEBSITE thì dùng webMessageMedia */
  if (platform_type.value === 'WEBSITE')
    return $cdn.webMessageMedia($props.message?.fb_page_id, TARGET_ID, index)

  /** nếu là FB_INSTAGRAM thì dùng igMessageMedia */
  if (platform_type.value === 'FB_INSTAGRAM')
    return $cdn.igMessageMedia($props.message?.fb_page_id, TARGET_ID, index)

  /** nếu là TIKTOK thì dùng tiktokMessageMedia */
  if (platform_type.value === 'TIKTOK')
    return $cdn.tiktokMessageMedia($props.message?.fb_page_id, TARGET_ID, index)

  /** nếu là ZALO_OA hoặc ZALO_PERSONAL thì dùng zaloMessageMedia */
  if (
    platform_type.value === 'ZALO_OA' ||
    platform_type.value === 'ZALO_PERSONAL'
  )
    return $cdn.zaloMessageMedia($props.message?.fb_page_id, TARGET_ID, index)
  /** còn lại dùng fbMessageMedia */
  return $cdn.fbMessageMedia($props.message?.fb_page_id, TARGET_ID, index)
}
/**làm sạch html trước khi hiển thị, tránh XSS */
function fixXss(text?: string) {
  // xử lý thẻ a có target="_blank" thành target="_self"
  return DOMPurify.sanitize(text || '', {
    ADD_ATTR: ['target'],
  })
}
class Main {
  /**
   * @param SERVICE_CREATE_DATA_SOURCE dịch vụ tạo dữ liệu file
   */
  constructor(
    private readonly SERVICE_CREATE_DATA_SOURCE: ICreateDataSource = container.resolve(
      CreateDataSource
    )
  ) {}

  /**xem chi tiết file này */
  viewAttachment(index: number = 0) {
    // lưu lại vị trí của phần tử được chọn
    selected_item_index.value = index

    // tạm thời xử lý data để hiện CTA
    data_source.value = this.SERVICE_CREATE_DATA_SOURCE.exec(
      $props.message,
      index,
      platform_type.value
    )

    // mở modal
    media_detail_ref.value?.toggleModal()
  }
  /**tạo ra kích thước cho phần từ trước khi hình ảnh, video được load */
  initSize(width?: number, height?: number) {
    // tính toán
    if ($props.is_reply) {
      return new FitSize(50, 50, width, height).toCss()
    }
    return new FitSize(368, 80, width, height).toCss()
  }
}
const $main = new Main()
</script>
