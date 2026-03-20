<template>
  <div
    :class="[
      (attachments?.length || 0) > 1 ? 'bg-white' : 'bg-yellow-50',
      'w-fit max-w-96',
    ]"
    class="p-2 rounded-lg flex flex-col gap-2"
  >
    <div class="flex gap-2 justify-between">
      <div class="flex flex-wrap relative z-10 gap-2">
        <template
          v-for="(attachment, index) of attachments"
          :key="index"
        >
          <div
            :class="$main.containerClass()"
            :style="
              $main.initSize(sizes?.[index]?.width, sizes?.[index]?.height)
            "
          >
            <!-- Hiển thị ảnh -->
            <img
              :src="attachment.url"
              class="object-contain w-full h-full"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { FitSize } from '@/utils/helper/Attachment'
import type {
  AttachmentSize,
  FileTypeInfo,
} from '@/service/interface/app/message'

/** Props */
const $props = withDefaults(
  defineProps<{
    /** Danh sách file đính kèm */
    attachments?: {
      url: string
      type: FileTypeInfo
    }[]
    /** Kích thước các file */
    sizes?: (AttachmentSize | null)[]
    /** Loại nền tảng của page */
    platform_type?: string
  }>(),
  {}
)

class Main {
  /** Lấy class cho container dựa theo platform */
  containerClass() {
    /** Kiểm tra có phải là page FB hoặc IG không */
    const IS_FB_OR_IG = ['FB_MESS', 'FB_INSTAGRAM'].includes(
      $props.platform_type || ''
    )
    /** Non-FB/IG: dùng bg-slate-50, FB/IG: dùng bg-gray-50 */
    return IS_FB_OR_IG
      ? 'rounded-lg bg-gray-50 overflow-hidden relative'
      : 'rounded-lg bg-slate-50 overflow-hidden relative'
  }

  /** Tạo ra kích thước cho phần tử trước khi hình ảnh được load */
  initSize(width?: number, height?: number) {
    /** Kiểm tra có phải là page FB hoặc IG không */
    const IS_FB_OR_IG = ['FB_MESS', 'FB_INSTAGRAM'].includes(
      $props.platform_type || ''
    )

    /**
     * Non-FB/IG: container vuông 160x160 fixed
     * Ảnh sẽ object-contain fit bên trong, phần trống có bg-slate-50
     */
    if (!IS_FB_OR_IG) {
      /** Trả về fixed size 160x160 */
      return 'width: 160px; height: 160px;'
    }

    /** Kiểm tra số lượng ảnh đính kèm */
    const ATTACHMENT_COUNT = $props.attachments?.length || 0
    /** FB_MESS + nhiều ảnh → layout grid */
    if (ATTACHMENT_COUNT > 1) {
      /** Tính toán và trả về style CSS cho layout grid */
      return new FitSize(368, 80, width, height).toCss()
    }

    /** FB_MESS + 1 ảnh → size ảnh đơn của FB */
    return new FitSize(247, 160, width, height).toCss()
  }
}
const $main = new Main()
</script>
