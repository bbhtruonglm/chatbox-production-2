<template>
  <Modal
    ref="modal_ref"
    class_modal="w-[400px] !p-0 rounded-2xl shadow-2xl overflow-hidden"
    class_body="h-[600px] flex flex-col p-0 overflow-hidden bg-[#F2F4F7]"
    class_header="hidden"
    class_footer="hidden"
    :is_show_footer="false"
    :is_show_header="false"
  >
    <template #body>
      <div class="flex-grow min-h-0 flex flex-col relative bg-slate-100">
        <MessageListModal
          v-if="conversation"
          :conversation="conversation"
          :messageStore="localMessageStore"
        />
        <div
          v-else
          class="w-full h-full flex justify-center items-center text-slate-500 gap-1"
        >
          <Loading />
        </div>
      </div>
      <InputChatModal
        v-if="conversation"
        :client_id="client_id"
        :conversation="conversation"
        :messageStore="localMessageStore"
        class="bg-slate-100"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConversationStore, useMessageStore } from '@/stores'
import { read_conversation } from '@/service/api/chatbox/n4-service'
import { container } from 'tsyringe'
import { Toast } from '@/utils/helper/Alert/Toast'

import Modal from '@/components/Modal.vue'
import MessageListModal from '@/views/ChatWarper/Chat/CenterContent/MessageListModal.vue'
import InputChatModal from '@/views/ChatWarper/Chat/CenterContent/InputChatModal.vue'
import ClientAvatar from '@/components/Avatar/ClientAvatar.vue'
import Loading from '@/components/Loading.vue'

import type { ConversationInfo } from '@/service/interface/app/conversation'

const $props = defineProps<{
  page_id?: string
  client_id?: string
}>()

const conversationStore = useConversationStore()
const $toast = container.resolve(Toast)

const localMessageStore = ref({
  list_message: [] as any[],
  send_message_list: [] as any[],
  reply_comment: {},
  reply_message: {},
  list_message_id: 'message-list-modal',
  is_show_to_bottom: false,
})
const modal_ref = ref<InstanceType<typeof Modal>>()
const conversation = ref<ConversationInfo>()
const previous_conversation = ref<ConversationInfo>()

const toggleModal = async () => {
  modal_ref.value?.toggleModal()

  // Nếu đang mở modal
  if (modal_ref.value?.is_open) {
    await initConversation()
  } else {
    // Khi đóng modal, restore lại conversation cũ nếu cần
    // Tuy nhiên, vì logic của app react theo store, việc restore có thể gây flash
    // Cần cân nhắc nhu cầu người dùng. Tạm thời restore để giữ context background
    if (previous_conversation.value) {
      conversationStore.select_conversation = previous_conversation.value
    }
  }
}

const initConversation = async () => {
  if (!$props.page_id || !$props.client_id) return

  // Lưu lại conversation hiện tại
  previous_conversation.value = conversationStore.select_conversation

  // Nếu lấy được hội thoại mới
  try {
    const res = await new Promise<any>((resolve, reject) => {
      read_conversation(
        {
          page_id: [$props.page_id!],
          client_id: $props.client_id!,
          limit: 1,
        },
        (e, r) => (e ? reject(e) : resolve(r))
      )
    })
    console.log(res, 'res')
    const first_conv_key = Object.keys(res?.conversation || {})?.[0]
    const conv = res?.conversation?.[first_conv_key]

    if (conv) {
      conversation.value = conv
      // Không cần cập nhật store global nữa vì đã dùng local store injection
      // conversationStore.select_conversation = conv
    } else {
      $toast.error('Không tìm thấy hội thoại')
      modal_ref.value?.toggleModal() // Đóng modal nếu lỗi
    }
  } catch (error) {
    console.error(error)
    $toast.error('Lỗi tải hội thoại')
    modal_ref.value?.toggleModal() // Đóng modal nếu lỗi
  }
}

defineExpose({ toggleModal })
</script>
