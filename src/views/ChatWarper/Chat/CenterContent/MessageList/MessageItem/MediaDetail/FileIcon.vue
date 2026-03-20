<template>
  <img
    v-if="type === 'WORD'"
    src="@/assets/imgs/word.png"
    class="size-5"
  />
  <img
    v-else-if="type === 'EXCEL'"
    src="@/assets/imgs/excel.png"
    class="size-5"
  />
  <img
    v-else-if="type === 'PPT'"
    src="@/assets/imgs/ppt.png"
    class="size-5"
  />
  <img
    v-else-if="type === 'PDF'"
    src="@/assets/imgs/pdf.png"
    class="size-5"
  />
  <DocumentIcon v-else class="w-5 h-5" />
</template>
  
<script setup lang='ts'>
import DocumentIcon from '@/components/Icons/Document.vue'

const $props = defineProps<{
  type: 'WORD' | 'EXCEL' | 'PPT' | 'PDF' | 'UNKNOWN'
}>()

</script>