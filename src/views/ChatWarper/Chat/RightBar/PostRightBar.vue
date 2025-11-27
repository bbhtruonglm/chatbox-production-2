<template>
  <div class="bg-white rounded-lg h-full flex flex-col">
    <div
      class="py-2 px-3 border-b flex-shrink-0 text-sm font-semibold flex items-center justify-between"
    >
      <div class="flex items-center gap-1">
        <ChartBarIcon class="size-5" />
        {{ $t('Thống kê bài viết') }}
      </div>
      <button
        v-tooltip.left="$t('Làm mới dữ liệu')"
        @click="ref_post_analytic?.getPostAnalytic(true)"
      >
        <ArrowPathIcon class="size-4" />
      </button>
    </div>
    <PostAnalytic ref="ref_post_analytic" />
  </div>
</template>
<script setup lang="ts">
import PostAnalytic from '@/views/ChatWarper/Chat/RightBar/PostAnalytic.vue'

import { ChartBarIcon, ArrowPathIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'

/**tham chiếu đến thống kê post */
const ref_post_analytic = ref<InstanceType<typeof PostAnalytic>>()
</script>
