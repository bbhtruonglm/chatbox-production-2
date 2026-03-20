<template>
  <ClipIcon
    @click="attachment_ref?.toggleDropdown"
    v-tooltip="$t('v1.view.main.dashboard.chat.input.file.title')"
    :class="{
      'text-slate-700': attachment_ref?.is_open,
    }"
    class="w-5 h-5 cursor-pointer text-slate-400 flex-shrink-0 hover:text-slate-700 my-1.5"
  />
  <Dropdown
    ref="attachment_ref"
    width="236px"
    height="auto"
    :is_fit="false"
    position="TOP"
    :back="20"
    :distance="10"
    class_content="flex flex-col gap-1"
  >
    <MenuItem
      @click="selectAttachmentFromDevice('image/*')"
      :icon="ImageIcon"
      :title="$t('v1.view.main.dashboard.chat.input.file.image')"
    />
    <MenuItem
      @click="uploadFile()"
      :icon="UploadIcon"
      :title="$t('v1.view.main.dashboard.chat.input.file.file')"
    />
    <hr />
    <MenuItem
      @click="album_ref?.toggleAlbum()"
      :icon="FolderIcon"
      :title="$t('v1.view.main.dashboard.chat.input.file.album')"
    />
  </Dropdown>
  <Album
    @pick_file="handlePickFile"
    ref="album_ref"
  />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useConversationStore, useMessageStore } from '@/stores'
import { handleFileLocal, validateFileSize } from '@/service/helper/file'
import { map, get } from 'lodash'
import { getFbFileType } from '@/service/helper/file'
import { toast } from '@/service/helper/alert'

import Dropdown from '@/components/Dropdown.vue'
import MenuItem from '@/components/Main/Dashboard/MenuItem.vue'
import Album from '@/views/ChatWarper/Chat/CenterContent/Album.vue'

import ClipIcon from '@/components/Icons/Clip.vue'
import ImageIcon from '@/components/Icons/Image.vue'
import UploadIcon from '@/components/Icons/Upload.vue'
import FolderIcon from '@/components/Icons/Folder.vue'

import type { FileInfo } from '@/service/interface/app/album'

const messageStore = useMessageStore()
const conversationStore = useConversationStore()

/**ref của dropdown */
const attachment_ref = ref<InstanceType<typeof Dropdown>>()
/**ref của quản lý album */
const album_ref = ref<InstanceType<typeof Album>>()

/**
 * tải lên tập tin
 * - nếu là fb, web thì cho tải tất cả các dạng
 * - nếu là zalo thì chỉ cho tải doc, pdf và docx
 */
function uploadFile(): void {
  /**loại nền tảng */
  const TYPE = conversationStore.select_conversation?.platform_type

  // nếu là zalo thì chỉ cho tải doc, pdf và docx
  if (TYPE === 'ZALO_OA') selectAttachmentFromDevice('.doc,.docx,.pdf')

  // nếu là fb, web thì cho tải tất cả các dạng
  else selectAttachmentFromDevice()
}
/**
 * chọn file từ thiết bị để gửi đi
 * @deprecated dùng qua UploadFile ở utils
 */
function selectAttachmentFromDevice(accept: string = '*') {
  // đang gửi thì không cho chọn lại file để bị lỗi
  if (messageStore.is_send_file) return

  /**input upload file */
  const INPUT = document.createElement('input')

  // thêm các thuộc tính cần thiết
  INPUT.type = 'file'
  INPUT.multiple = true
  INPUT.accept = accept
  INPUT.style.display = 'none'

  // hàm xử lý sau khi upload thành công
  INPUT.onchange = () => {
    // làm sạch danh sách file
    messageStore.upload_file_list = []

    /** lọc các file vượt quá 20MB */
    const VALID_FILES = Array.from(INPUT.files || []).filter(file => {
      // kiểm tra kích thước file
      if (!validateFileSize(file)) {
        toast('error', `File "${file.name}" vượt quá 20MB`)
        return false
      }
      return true
    })

    // ghi dữ liệu vào mảng
    map(VALID_FILES, file => handleFileLocal(file))

    // xoá input sau khi xong việc
    if (INPUT && INPUT.parentNode) INPUT.parentNode.removeChild(INPUT)

    // tự động tắt luôn dropdown
    attachment_ref.value?.toggleDropdown()
  }

  // thêm input vào html
  document.body.appendChild(INPUT)

  // click vào input
  INPUT.click()
}
/**xử lý các file được chọn từ album */
function handlePickFile(file_list: FileInfo[]) {
  messageStore.upload_file_list?.push(
    ...file_list?.map(file => {
      /**kiểu dữ liệu của fb */
      const TYPE = getFbFileType(file.mimetype)
      /*** id random để thêm vào thuộc tính id khi render */
      const ID = crypto.randomUUID()

      return {
        id: ID,
        type: TYPE,
        is_done: false,
        is_loading: false,
        preview: TYPE === 'image' ? file.url : undefined,
        url: file.url,
        file_name: file.original_name,
        fb_image_id: get(file, 'fb_image_id[0]'),
      }
    })
  )

  // tự động tắt luôn dropdown
  attachment_ref.value?.toggleDropdown()
}
</script>
