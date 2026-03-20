<template>
  <div ref="filter_dropdown_ref" class="relative w-full">
    <div class="border w-full px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer" @click="toggle">
        <p v-if="!page_selected?.page?.name">
            {{ $t('v1.view.main.dashboard.chat.filter.label.all_page') }}
        </p>
        <p v-if="page_selected?.page?.name" class="w-[90%] truncate">{{ page_selected.page.name }}</p>
        <img :src="DownIcon" class="w-3" alt="">
    </div>
    <div v-if="is_open" class="absolute max-h-96 overflow-auto bg-white border rounded-lg w-full p-1 mt-1">
      <div 
            @click="selectPage()"
            class="cursor-pointer flex items-center mb-1 hover:bg-orange-100 rounded-lg p-1"
        >
            <p class="text-[14px] ml-1 w-[90%] truncate">
                {{ $t('v1.view.main.dashboard.chat.filter.label.all_page') }}
            </p>
        </div>
        <div 
            v-for="page_info, page_id in pages" 
            @click="selectPage(page_info, page_id as string)"
            class="cursor-pointer flex items-center mb-1 hover:bg-orange-100 rounded-lg p-1"
        >
            <PageAvatar
                :page_info="page_info.page"
                class="rounded-full border-2 border-white w-8 h-8"
            />
            <p class="text-[14px] ml-1 w-[90%] truncate">{{ page_info.page?.name }}</p>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { usePageStore } from '@/stores'

// * Components
import PageAvatar from '@/components/Avatar/PageAvatar.vue'

// * Icon
import DownIcon from '@/assets/icons/arrow-down.svg'

// * Interface
import type { PageList, PageData } from '@/service/interface/app/page'

const $props = withDefaults(defineProps<{
    select_page: Function
}>(), {})

// * Use Store
const pageStore = usePageStore()

/** Id page đã chọn */
const page_selected = ref<PageData>()
/** Danh sách page đã chọn */
const pages = ref<PageList>(pageStore.selected_page_list_info)
/**ref của dropdown */
const filter_dropdown_ref = ref<HTMLElement>()

  /** ẩn hiện dropdown */
const is_open = ref(false)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

/** Ẩn hiện dropdown */
function toggle() {
    is_open.value = !is_open.value
}
/** Chọn page */
function selectPage(page?: PageData, page_id?: string) {
    // đóng dropdown
    is_open.value = false

    // Trường hợp chọn tất cả page
    if(!page) {
        page_selected.value = undefined
        $props.select_page('')
    }

    // Trường hợp chọn 1 page
    page_selected.value = page
    $props.select_page(page_id)
}

/** hàm xử lý khi click ra ngoài dropdown */
function handleClickOutside(event: MouseEvent) {
  // nếu không có thì thôi
  if (!filter_dropdown_ref.value) return

  // nếu có thì check xem click bên trong hay bên ngoài
  if (!filter_dropdown_ref.value.contains(event.target as Node)) {
    is_open.value = false
  }
}

</script>