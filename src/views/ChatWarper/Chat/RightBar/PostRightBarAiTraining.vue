<template>
  <div class="bg-white rounded-lg h-full flex flex-col">
    <!-- Header -->
    <div>
      <div
        class="py-2 px-3 border-b flex-shrink-0 text-sm font-semibold flex items-center justify-between"
      >
        <div class="flex items-center gap-1">
          <SparklesIcon class="size-5" />
          {{ $t('Huấn luyện AI') }}
        </div>
      </div>
    </div>

    <!-- Nội dung -->
    <div class="p-3 flex flex-col w-full gap-1">
      <!-- Input / Textarea -->
      <div>
        <textarea
          v-if="is_expanded"
          v-model="description"
          rows="6"
          class="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="Nhập nội dung để huấn luyện AI tư vấn khách hàng"
        ></textarea>

        <input
          v-else
          type="text"
          v-model="description"
          @focus="is_expanded = true"
          class="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Nhập nội dung để huấn luyện AI tư vấn khách hàng"
        />
      </div>
      <div>
        <!-- Nút Lưu -->
        <div
          v-if="is_expanded"
          class="mt-2 flex justify-end gap-2"
        >
          <button
            class="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
            @click="cancel"
          >
            {{ $t('Hủy') }}
          </button>
          <button
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="save"
          >
            {{ $t('Lưu') }}
          </button>
        </div>
        <div
          v-else
          class="text-xs text-slate-700"
        >
          {{
            $t(
              'Khi khách hàng tương tác vào bài viết này, AI sẽ dựa theo nội dung của bạn huấn luyện để AI tư vấn khách hàng hiệu quả.'
            )
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SparklesIcon } from '@heroicons/vue/24/solid'
import { update_info_conversation } from '@/service/api/chatbox/n4-service'
import { reject } from 'lodash'
import { useConversationStore } from '@/stores'
/** Trạng thái mở rộng */
const is_expanded = ref(false)
/** mô tả */
const description = ref<string>('')
/** Khai báo conversation */
const conversationStore = useConversationStore()
/** Theo dõi data trong store */
watch(
  () => conversationStore.select_conversation?.ai_description,
  newVal => {
    /** Gán giá trị */
    description.value = newVal || ''
  },
  { immediate: true }
)

/** Hủy bỏ chỉnh sửa */
const cancel = () => {
  is_expanded.value = false
}
/**id của trang */
const page_id = computed(
  () => conversationStore.select_conversation?.fb_page_id
)
/**id của khách hàng */
const client_id = computed(
  () => conversationStore.select_conversation?.fb_client_id
)
/** Gọi API lưu dữ liệu */
const save = async () => {
  try {
    /**gọi api cập nhật tên khách hàng */
    await new Promise((resolve, reject) => {
      /**nếu chưa có id của trang hoặc khách hàng thì bỏ qua */
      if (!page_id.value || !client_id.value) return

      update_info_conversation(
        {
          page_id: page_id.value,
          client_id: client_id.value,
          ai_description: description.value,
        },
        (e, r) => {
          if (e) reject(e)
          else resolve(r)
        }
      )
    })
    is_expanded.value = false
    console.log('Đã lưu:', description.value)
  } catch (err) {
    console.error('Lỗi khi lưu:', err)
  }
}

/** Hàm giả lập API (thay bằng call thực tế, ví dụ axios.post('/api/save', {description: description.value})) */
const fakeApiSave = (data: string) => {
  return new Promise(resolve => setTimeout(() => resolve(data), 500))
}
</script>
