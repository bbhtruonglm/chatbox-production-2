<template>
  <div class="overflow-hidden flex justify-center flex-grow min-h-0 h-full">
    <img
      v-if="data_source?.image?.url"
      :src="url || data_source?.image?.url"
      class="attachment-size"
    />
    <template v-if="data_source?.video?.url">
      <video
        v-if="!is_mini"
        class="attachment-size"
        controls
        preload="metadata"
      >
        <source
          :src="url || data_source?.video?.url"
          type="video/mp4"
        />
      </video>
      <img
        v-else
        class="attachment-size"
        src="@/assets/icons/play.svg"
      />
    </template>
    <template v-if="data_source?.audio?.url && url">
      <Audio
        v-if="!is_mini"
        :src="url || data_source?.audio?.url"
        class="w-full p-3"
      />
      <img
        v-else
        class="attachment-size"
        src="@/assets/icons/audio.svg"
      />
    </template>
    <div
      v-if="data_source?.file?.url && url"
      class="w-full h-full flex justify-center"
    >
      <iframe
        v-if="isOffice()"
        :src="`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`"
        frameborder="0"
        class="h-full w-full"
      ></iframe>

      <iframe
        v-else-if="isPdf()"
        :src="`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`"
        frameborder="0"
        class="h-full w-full"
      ></iframe>
      <div
        class="message-box bg-white flex flex-col items-end text-slate-700 w-fit"
        v-else
      >
        <div class="p-2 rounded-full bg-slate-300 w-9 h-9">
          <FileIcon
            :type="
              getFileType(
                getFileExtension(message?.message_text || '') ||
                  getFileExtension(getFileName(data_source?.file?.url) || ''),
              )
            "
          />
        </div>
        <div class="text-sm truncate min-w-0 w-full underline">
          {{ getFileName(data_source?.file?.url) }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { getFileExtension, getFileType } from '@/service/helper/file'
import { getFileName } from '@/service/helper/queryString'

import Audio from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/MessageTemplate/Media/Audio.vue'
import FileIcon from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/MediaDetail/FileIcon.vue'

import type {
  MessageInfo,
  MessageTemplateInput,
} from '@/service/interface/app/message'

const $props = withDefaults(
  defineProps<{
    /** dữ liệu tin nhắn */
    message?: MessageInfo
    /**dữ liệu */
    data_source?: MessageTemplateInput
    /**link media */
    url?: string
    /**hiển thị cỡ nhỏ */
    is_mini?: boolean
  }>(),
  {},
)

/** kiểm tra có phải pdf không ở cả tên và message_text */
function isPdf(): boolean {
  return (
    isPdfFile($props.message?.message_text || '') ||
    isPdfFile(getFileName($props.data_source?.file?.url) || '')
  )
}

/** kiểm tra xem có phải file office không */
function isOffice(): boolean {
  return (
    isOfficeViewableFile($props.message?.message_text || '') ||
    isOfficeViewableFile(getFileName($props.data_source?.file?.url) || '')
  )
}

/** nếu là các loại field có thể mở bằng preview office */
function isOfficeViewableFile(file_name: string): boolean {
  // nếu không có tên file thì thôi
  if (!file_name) return false
  /** phần đuôi file */
  const EXTENSION = file_name.split('.').pop()?.toLowerCase()

  /** các mở rộng hỗ trợ xem */
  const SUPPORTED_EXTENSIONS = [
    // Word
    'doc',
    'docx',
    'dot',
    'dotx',
    // Excel
    'xls',
    'xlsx',
    'xlsm',
    // PowerPoint
    'ppt',
    'pptx',
    'pps',
    'ppsx',
  ]

  return EXTENSION ? SUPPORTED_EXTENSIONS.includes(EXTENSION) : false
}

/** nếu là fild pdf */
function isPdfFile(file_name: string): boolean {
  // nếu không có tên file thì thôi
  if (!file_name) return false
  /** phần đuôi file */
  const EXTENSION = file_name.split('.').pop()?.toLowerCase()
  return EXTENSION === 'pdf'
}
</script>
<style lang="scss" scoped>
.attachment-size {
  @apply h-full object-contain rounded-lg;
}
</style>
