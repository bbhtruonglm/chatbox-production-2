<template>
  <SkeletonLoading v-if="is_loading" />
  <div
    v-else
    id="chat__center-content"
    class="h-full flex flex-col flex-grow min-w-0"
  >
    <UserInfo />
    <MessageList />
    <InputChat :client_id="$route.query.user_id?.toString()" />
  </div>
  <template>
    <!-- <AttachmentViewModal /> -->
    <StaffReadModal />
    <ZaloPersonalModal
      :message="message_data"
      ref="modal_zalo_personal_ref"
    />
    <ZaloCreateGroup
      :message="message_data"
      ref="modal_zalo_create_group_ref"
    />
    <ZaloShareMessage
      :message="message_data"
      ref="modal_zalo_share_message_ref"
    />
  </template>
</template>
<script setup lang="ts">
import { useMessageStore } from '@/stores'
import { storeToRefs } from 'pinia'

import InputChat from '@/views/ChatWarper/Chat/CenterContent/InputChat.vue'
import MessageList from '@/views/ChatWarper/Chat/CenterContent/MessageList.vue'
// import AttachmentViewModal from '@/views/ChatWarper/Chat/CenterContent/AttachmentViewModal.vue'
import ZaloPersonalModal from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/PhoneAction/ZaloPersonalModal.vue'
import ZaloShareMessage from '@/views/ChatWarper/Chat/CenterContent/MessageList/MessageItem/PhoneAction/ZaloShareMessage.vue'
import StaffReadModal from '@/views/ChatWarper/Chat/CenterContent/StaffReadModal.vue'
import UserInfo from '@/views/ChatWarper/Chat/CenterContent/UserInfo.vue'
import SkeletonLoading from '@/views/ChatWarper/Chat/CenterContent/SkeletonLoading.vue'
import { useRoute } from 'vue-router'
import ZaloCreateGroup from './CenterContent/MessageList/MessageItem/PhoneAction/ZaloCreateGroup.vue'
// props
defineProps<{
  /** có nên hiển thị skeleton loading ko */
  is_loading?: boolean
}>()

/** state */
const {
  modal_zalo_personal_ref,
  message_data,
  modal_zalo_create_group_ref,
  modal_zalo_share_message_ref,
} = storeToRefs(useMessageStore())

/** router */
const $route = useRoute()
</script>
