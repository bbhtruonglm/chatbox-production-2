<template>
  <Modal
    @open_modal="$main.onOpenModal()"
    id="chat__view-attachment"
    ref="ref_media_detail"
    class_modal="w-[900px] h-4/5"
  >
    <template v-slot:header>
      {{ $t('v1.view.main.dashboard.chat.message.attachment.title') }}
    </template>
    <template v-slot:body>
      <div
        class="bg-white rounded-md p-2 gap-3 grid relative w-full h-full"
        :class="{
          'grid-cols-2': is_check_ai,
        }"
      >
        <div class="flex flex-col gap-5 overflow-hidden cursor-zoom-in">
          <Item
            @click="$main.previewImage()"
            :data_source="input.data_source"
            :url="input.url"
            :message="message"
          />
          <div
            v-if="gt(input.message?.message_attachments?.length, 1)"
            :class="is_expand ? 'max-h-[132px]' : 'h-[46px]'"
            class="flex-shrink-0 flex gap-1.5 items-end"
          >
            <div
              ref="ref_attachments"
              class="flex flex-wrap justify-start gap-1.5 overflow-hidden h-full py-[3px] px-[3px]"
            >
              <button
                v-for="(attachment, att_index) of input.message
                  ?.message_attachments"
                @click="$main.changeAttachment(att_index)"
                :class="{
                  'fake-border-3-blue-700': input.index === att_index,
                }"
                class="w-10 h-10 rounded-lg bg-slate-100"
              >
                <Item
                  :data_source="$main.getDataSource(att_index)"
                  is_mini
                />
              </button>
            </div>
            <button
              v-if="count_hidden_item"
              @click="is_expand = !is_expand"
              class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex justify-center items-center text-sm font-medium mb-[3px]"
            >
              +
              {{ count_hidden_item }}
            </button>
          </div>
        </div>
        <div
          class="h-full overflow-hidden border rounded-lg py-2 px-3 flex flex-col gap-2.5 text-sm"
          v-if="is_check_ai"
        >
          <div
            class="bg-slate-200 text-xs font-medium py-1 px-2 rounded flex-shrink-0"
          >
            {{ $t('v1.view.main.dashboard.chat.message.attachment.ai_handle') }}
          </div>
          <div class="min-h-0 overflow-y-auto flex flex-col gap-0 enter-line">
            <div
              v-if="input.data_source?.ocr?.description"
              class="font-medium"
            >
              {{ $t('v1.view.main.dashboard.chat.message.summary') }}:
              {{ input.data_source?.ocr?.description }}
              <div>---------</div>
            </div>
            <div>
              {{ input.data_source?.ocr?.original_text }}
            </div>
          </div>
          <button
            v-if="input.data_source?.ocr?.original_text"
            @click="$clipboard.copy(input.data_source?.ocr?.original_text)"
            class="py-2 px-4 rounded-md text-white bg-slate-700 w-fit"
          >
            {{
              $t('v1.view.main.dashboard.chat.message.attachment.copy_content')
            }}
          </button>
          <Action
            v-if="input.data_source?.list_button?.length"
            :list_button="input.data_source?.list_button"
            :message_id="input.message_id"
            :message
          />
        </div>
        <Teleport to="body">
          <PreviewImage
            v-if="is_preview_image"
            :image_url="input?.url"
            :close="$main.closePreviewImage"
          />
        </Teleport>
      </div>
    </template>
    <template v-slot:footer>
      <div class="flex justify-between">
        <button
          @click="$main.toggleModal()"
          class="custom-btn bg-white text-slate-700"
        >
          {{ $t('v1.common.close') }}
        </button>
        <button
          @click="$main.downloadFile"
          class="custom-btn text-white bg-blue-700"
        >
          {{ $t('v1.common.download') }}
        </button>
      </div>
    </template>
  </Modal>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { container } from 'tsyringe'
import { Clipboard } from '@/utils/helper/Clipboard'
import { gt } from 'lodash'
import { WindowAction, type IWindowAction } from '@/utils/helper/Navigation'
import {
  CountHiddenItem,
  type ICounHiddenItem,
} from '@/utils/helper/CountHiddenItem'
import { CreateDataSource, type ICreateDataSource } from '../CreateDataSource'

import Item from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/MediaDetail/Item.vue'
import Action from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/MessageTemplate/Action.vue'
import PreviewImage from '@/components/PreviewImage.vue'
import Modal from '@/components/Modal.vue'

import type {
  MessageInfo,
  MessageTemplateInput,
} from '@/service/interface/app/message'

/**dữ liệu đầu vào */
interface Input {
  /**dữ liệu */
  data_source?: MessageTemplateInput
  /**link media */
  url?: string
  /**id của tin nhắn */
  message_id?: string
  /**dữ liệu của tin nhắn */
  message?: MessageInfo
  /**vi trí của phần tử trong mảng */
  index?: number
}

const $props = withDefaults(defineProps<Input>(), {})
const $clipboard = container.resolve(Clipboard)

/**ref của modal xem chi tiết file */
const ref_media_detail = ref<InstanceType<typeof Modal>>()
/**ref của div */
const ref_attachments = ref<HTMLDivElement>()
/**đếm số phần tử bị ẩn */
const count_hidden_item = ref<number>()
/**dữ liệu đầu vào */
const input = ref<Input>($props)
/**có hiển thị hết không */
const is_expand = ref<boolean>()
/** xem trước ảnh */
const is_preview_image = ref<boolean>(false)

/** cờ check có mô tả AI hay không */
const is_check_ai = computed(() => {
  return Boolean(
    input.value.data_source?.ocr?.description ||
    input.value.data_source?.ocr?.original_text ||
    input.value.data_source?.list_button?.length,
  )
})

class Main {
  /**
   * @param SERVICE_COUNT_HIDDEN_ITEM dịch vụ đếm số phần tử bị ẩn
   * @param SERVICE_WINDOW_ACTION dịch vụ mở tab mới
   * @param SERVICE_CREATE_DATA_SOURCE tạo dữ liệu file
   */
  constructor(
    private readonly SERVICE_COUNT_HIDDEN_ITEM: ICounHiddenItem = container.resolve(
      CountHiddenItem,
    ),
    private readonly SERVICE_WINDOW_ACTION: IWindowAction = container.resolve(
      WindowAction,
    ),
    private readonly SERVICE_CREATE_DATA_SOURCE: ICreateDataSource = container.resolve(
      CreateDataSource,
    ),
  ) {}

  /**lấy dữ liệu của file */
  getDataSource(index?: number) {
    // trả về dữ liệu của file
    return this.SERVICE_CREATE_DATA_SOURCE.exec($props.message, index)
  }
  /**chọn att khác */
  changeAttachment(index?: number) {
    // thay lại giá trị của att mới được chọn
    input.value = {
      ...input.value,
      ...{
        data_source: this.getDataSource(index),
        index,
      },
    }
  }
  /**đếm số phần tử bị ẩn khi mở modal */
  async onOpenModal() {
    // mặc định ẩn list
    is_expand.value = false

    // đợi vue render xong
    await nextTick()

    // đếm số phần tử bị ẩn
    count_hidden_item.value = await this.SERVICE_COUNT_HIDDEN_ITEM.exec(
      'button',
      ref_attachments.value,
    )
  }
  /**mở modal xem chi tiết file */
  toggleModal() {
    ref_media_detail.value?.toggleModal()
  }
  /**tải về tập tin */
  downloadFile() {
    /**nguồn dữ liệu */
    const SOURCE = input.value.data_source

    /**đường dẫn */
    const URL =
      SOURCE?.image?.url ||
      SOURCE?.video?.url ||
      SOURCE?.audio?.url ||
      SOURCE?.file?.url

    // mở link để tải về
    this.SERVICE_WINDOW_ACTION.openNewTab(URL || input.value.url)
  }

  /** hàm xem trước ảnh */
  previewImage() {
    // nếu có link ảnh thì mới xem trước
    if (input.value.data_source?.image?.url) is_preview_image.value = true
  }

  /** hàm đóng xem ảnh */
  closePreviewImage() {
    is_preview_image.value = false
  }
}
const $main = new Main()

//  nếu chọn lại item của danh sách từ bên ngoài, thì map lại chính xác
watch(
  () => $props.index,
  index => $main.changeAttachment(index),
)

// xuất phương thức
defineExpose({ toggleModal: $main.toggleModal.bind($main) })
</script>
<style lang="scss" scoped>
.custom-btn {
  @apply py-2 px-5 flex items-center gap-1 rounded-lg text-sm;
}
.fake-border-3-blue-700 {
  @apply shadow-[0_0_0_3px_rgba(29,78,216,1)];
}
</style>
