<template>
  <div
    v-tooltip.bottom="$t('Trợ lý AI')"
    class="flex flex-col items-end"
    :class="{
      'text-slate-400': !is_enable,
    }"
  >
    <div class="flex items-center gap-1">
      <SparklesIcon class="size-4" />
      <Toggle
        :modelValue="is_enable"
        @click="$main.toggleClientChatbot()"
        :class_toggle="`peer-checked:bg-black !h-4 !w-7 after:!h-3 after:!w-3 ${
          ai_agent_working_hour_answer?.type === 'NOT_ANSWER' &&
          'cursor-not-allowed'
        }`"
        :disabled="true"
      />
    </div>
    <p class="text-xxs leading-3">{{ getAiAgentStatus?.() }}</p>
    <ChooseTimeDisableAI ref="choose_time_disable_modal_ref" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { composableService } from '@/views/ChatWarper/Chat/CenterContent/UserInfo/ChatbotStatus/service'

import Toggle from '@/components/Toggle.vue'
import ChooseTimeDisableAI from '@/views/ChatWarper/Chat/CenterContent/UserInfo/ChooseTimeDisableAI.vue'

import { SparklesIcon } from '@heroicons/vue/24/solid'

const { is_enable, ai_agent_working_hour_answer, getAiAgentStatus } =
  composableService()

const choose_time_disable_modal_ref =
  ref<InstanceType<typeof ChooseTimeDisableAI>>()

class Main {
  toggleClientChatbot() {
    // nếu setting là không trả lời thì không cho thay đổi
    if (ai_agent_working_hour_answer?.value?.type === 'NOT_ANSWER') return

    // nếu không tồn tại cờ bật/tắt chatbot thì thôi
    if (is_enable === undefined) return

    // nếu đang bật thì mở modal tắt
    if (is_enable?.value) {
      choose_time_disable_modal_ref.value?.toggleModal()
      return
    }

    // nếu đang tắt chatbot thì bật cờ
    is_enable.value = true
  }
}

const $main = new Main()
</script>
