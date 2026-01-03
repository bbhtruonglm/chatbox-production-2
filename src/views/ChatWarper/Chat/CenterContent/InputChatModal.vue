<template>
  <div
    v-if="client_id"
    id="chat__input-chat"
    class="w-full relative flex-shrink-0 flex flex-col px-3 py-2"
  >
    <ScrollToBottomBtn />
    <!-- Trả lời bình luận bài viết fb -->
    <ReplyComment v-if="messageStore.reply_comment?.root_comment_id" />
    <ReplyMessage v-if="messageStore.reply_message?.root_message_id" />
    <ListLabel
      v-if="conversationStore.select_conversation?.conversation_type !== 'POST'"
      :conversation="conversationStore.select_conversation"
    />
    <PreviewAttachment />
    <MainInput :conversation="conversationStore.select_conversation" />
  </div>
</template>
<script setup lang="ts">
import { useConversationStore, useMessageStore } from '@/stores'

import ScrollToBottomBtn from '@/views/ChatWarper/Chat/CenterContent/InputChat/ScrollToBottomBtn.vue'
import ListLabel from '@/views/ChatWarper/Chat/CenterContent/InputChat/ListLabel.vue'
import PreviewAttachment from '@/views/ChatWarper/Chat/CenterContent/InputChat/PreviewAttachment.vue'
import MainInput from '@/views/ChatWarper/Chat/CenterContent/InputChat/MainInput.vue'
import ReplyComment from '@/views/ChatWarper/Chat/CenterContent/InputChat/ReplyComment.vue'
import ReplyMessage from './InputChat/ReplyMessage.vue'
import { computed } from 'vue'

const props = defineProps<{
  client_id?: string
  conversation?: any
  messageStore?: any
}>()

/** Khai báo tin nhắn từ store */
const globalMessageStore = useMessageStore()
/** Khai báo list conversation từ store */
const globalConversationStore = useConversationStore()

const messageStore = computed(() => props.messageStore || globalMessageStore)

const conversationStore = computed(() => {
  if (props.conversation) {
    return {
      select_conversation: props.conversation,
      select_conversation_id: props.conversation?._id,
    }
  }
  return globalConversationStore
})
</script>
