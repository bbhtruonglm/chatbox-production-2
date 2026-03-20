<template>
  <div
    id="chat__preview_attachment"
    v-if="files_count"
    class="flex items-center gap-2"
  >
    <div
      ref="ref_items"
      class="flex flex-wrap justify-center overflow-hidden gap-2 flex-grow h-10"
    >
      <button
        v-for="(file, index) of messageStore.upload_file_list"
        class="overflow-hidden rounded-lg relative group"
      >
        <CloseBoldIcon
          v-if="!file.is_done && !file.is_loading"
          @click="$main.deleteUploadFile(index)"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block bg-white rounded-full"
        />
        <div
          v-if="file.is_loading"
          class="center"
        >
          <Loading />
        </div>
        <img
          v-if="file.is_done"
          class="center"
          src="@/assets/icons/check-circle.svg"
        />
        <img
          v-if="file.preview"
          :id="file.id"
          class="attachment-size"
          :src="file.preview"
        />
        <img
          v-else-if="file.type === 'image'"
          class="attachment-size"
          src="@/assets/icons/picture.svg"
        />
        <img
          v-else-if="file.type === 'video'"
          class="attachment-size"
          src="@/assets/icons/play.svg"
        />
        <img
          v-else-if="file.type === 'audio'"
          class="attachment-size"
          src="@/assets/icons/audio.svg"
        />
        <img
          v-else
          class="attachment-size"
          src="@/assets/icons/file.svg"
        />
      </button>
    </div>
    <div
      v-if="total_over_item"
      class="attachment-size rounded-lg bg-white flex items-center justify-center text-sm font-medium flex-shrink-0"
    >
      +
      {{ total_over_item }}
    </div>
    <div
      class="border border-slate-500 rounded py-1 px-1.25 flex items-center gap-1 bg-white flex-shrink-0"
    >
      <ReloadIcon
        :class="{
          'animate-spin': is_loading,
        }"
        class="w-4 h-4"
      />
      <div class="text-sm font-medium">
        <span class="text-green-600">{{ done_files_count }}</span>
        /
        {{ files_count }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { size, pullAt } from 'lodash'
import { useMessageStore } from '@/stores'
import { computed, ref, watch } from 'vue'

import Loading from '@/components/Loading.vue'

import ReloadIcon from '@/components/Icons/Reload.vue'
import CloseBoldIcon from '@/components/Icons/CloseBold.vue'
import { container } from 'tsyringe'
import { CountHiddenItem } from '@/utils/helper/CountHiddenItem'

const messageStore = useMessageStore()
const $count_hidden_item = container.resolve(CountHiddenItem)

/**tham chiếu đến div danh sách */
const ref_items = ref<HTMLDivElement>()
/**tổng số file bị ẩn */
const total_over_item = ref<number>()

/**số lượng các tệp muốn gửi */
const files_count = computed(() => size(messageStore.upload_file_list))
/**số lượng các tệp đã gửi xong */
const done_files_count = computed(
  () => messageStore.upload_file_list.filter(file => file.is_done).length
)
/**có đang gửi tệp không */
const is_loading = computed(() => {
  /**phần tử đầu tiên */
  const FIRST_ITEM = messageStore.upload_file_list?.[0]

  // phần tử đầu tiên đang gửi, hoặc đã gửi xong
  return FIRST_ITEM?.is_loading || FIRST_ITEM?.is_done
})

// đếm số file bị ẩn
watch(
  () => messageStore.upload_file_list,
  async () => {
    total_over_item.value = await $count_hidden_item.exec(
      'button',
      ref_items.value
    )
  },
  { deep: true }
)

class Main {
  /**xoá file định gửi */
  deleteUploadFile(index: number) {
    pullAt(messageStore.upload_file_list, index)
  }
}
const $main = new Main()
</script>
<style scoped lang="scss">
.center {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
}
.attachment-size {
  @apply h-10 w-10;
}
</style>
