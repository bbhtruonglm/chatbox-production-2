<template>
  <MenuTitle
    :title="$t('v1.view.main.dashboard.chat.filter.exclude_label.title')"
  />
  <div
    class="py-3 grid gap-2"
    :class="{
      'grid-cols-1':
        Object.keys(pageStore.selected_page_list_info).length === 1,
      'grid-cols-2': Object.keys(pageStore.selected_page_list_info).length > 1,
    }"
  >
    <SelectPage
      v-if="Object.keys(pageStore.selected_page_list_info).length > 1"
      :select_page="filterLabelByPage"
    />
    <input
      ref="search_ref"
      type="text"
      :placeholder="$t('Tìm kiếm nhãn')"
      class="border px-3 py-1 rounded-lg focus:outline-none w-full text-sm"
      v-on:keyup="searchLabel"
      v-model.trim="label_search_name"
    />
  </div>
  <div class="h-[calc(100%_-_88px)] overflow-y-auto">
    <TagItem
      :is_disable="isDisableLabel(item)"
      v-for="item of display_label_list"
      v-show="item.show_label"
      @click="selectLabel(item)"
      :label="item"
      :is_selected="item?.is_selected"
    />
  </div>
</template>
<script setup lang="ts">
import { nonAccentVn } from '@/service/helper/format'
import { useConversationStore, usePageStore } from '@/stores'
import { debounce, map, size, sortBy, uniq } from 'lodash'
import { computed, onMounted, ref } from 'vue'

import MenuTitle from '@/components/Main/Dashboard/MenuTitle.vue'
import SelectPage from '@/views/ChatWarper/Menu/FilterModal/Tag/SelectPage.vue'
import TagItem from '@/views/ChatWarper/Menu/FilterModal/Tag/TagItem.vue'

import type { ILabel } from '@/service/interface/app/label'
import type { ComponentRef } from '@/service/interface/vue'

const conversationStore = useConversationStore()
const pageStore = usePageStore()

/** Danh sách label của page đang được chọn */
const label_list = defineModel<ILabel[]>('label_list', {
  default: [],
  required: true,
})
/** Snap label của page đang được chọn */
const snap_labels = defineModel<{ [index: string]: ILabel }>('snap_labels', {
  default: {},
  required: true,
})
/** ID page hiện tại đang được chọn */
const label_search_name = ref<string>('')
/**ref của dropdown search */
const search_ref = ref<ComponentRef>()

onMounted(() => {
  label_list.value = sortLabel(map(snap_labels.value))
})

/** Dữ liệu nhãn đã qua xử lý gom nhóm và thống kê trùng lặp */
const processed_label_data = computed(() => {
  const lst = label_list.value || []
  // Kiểm tra xem người dùng có đang chọn lọc trên nhiều trang cùng lúc hay không
  const is_multi_page = Object.keys(pageStore.selected_page_list_info).length > 1

  // Nếu chỉ chọn 1 trang, không cần gom nhóm hay thống kê trùng lặp
  if (!is_multi_page) {
    return {
      display_list: lst,
      duplicate_page_count: 0,
      duplicate_label_count: 0,
    }
  }

  // Sử dụng Map (Object) để nhóm các nhãn có cùng tên và cùng mã màu vào làm một
  const groups: Record<
    string,
    ILabel & {
      label_count?: number
      page_count?: number
      _ids?: string[]
      _page_ids?: string[]
    }
  > = {}

  lst.forEach(item => {
    const key = `${item.title}-${item.bg_color}`
    if (!groups[key]) {
      // Khởi tạo nhóm mới nếu chưa tồn tại nhãn nào có cùng thuộc tính title và bg_color
      groups[key] = {
        ...item,
        label_count: 1,
        _ids: [item._id],
        _page_ids: [item.fb_page_id],
        // Mặc định hiển thị nhãn nếu nhãn thành viên bất kỳ đang được bật cờ hiển thị
        show_label: item.show_label !== false,
      }
    } else {
      // Nếu nhãn đã tồn tại trong nhóm, cộng dồn số lượng nhãn và lưu lại danh sách ID/Page ID
      groups[key]._ids?.push(item._id)
      groups[key]._page_ids?.push(item.fb_page_id)
      groups[key].label_count = (groups[key].label_count || 0) + 1

      // Đồng bộ trạng thái: Nếu bất kỳ nhãn thực tế nào đang được chọn thì nhãn đại diện nhóm cũng hiển thị là đã chọn
      if (item.is_selected) groups[key].is_selected = true
      // Đảm bảo cờ hiển thị được duy trì nếu có ít nhất một nhãn thành viên thỏa mãn điều kiện lọc
      if (item.show_label) groups[key].show_label = true
    }
  })

  const group_list = map(groups).map(group => {
    // Tính toán số lượng trang duy nhất chứa nhãn này
    group.page_count = new Set(group._page_ids).size
    return group
  })

  // Lọc ra các nhóm nhãn xuất hiện ở nhiều hơn 1 trang
  const duplicate_labels = group_list.filter(g => (g.page_count || 0) > 1)
  const duplicate_label_count = duplicate_labels.length

  // Tập hợp các ID trang bị trùng lặp nhãn
  const duplicate_pages = new Set<string>()
  duplicate_labels.forEach(g => {
    g._page_ids?.forEach(p_id => duplicate_pages.add(p_id))
  })
  const duplicate_page_count = duplicate_pages.size

  return {
    display_list: sortLabel(group_list),
    duplicate_page_count,
    duplicate_label_count,
  }
})

/** Danh sách nhãn hiển thị đã được xử lý gom nhóm theo tiêu đề và màu sắc khi chọn nhiều trang để tránh trùng lặp giao diện */
const display_label_list = computed(() => processed_label_data.value.display_list)

/** Số lượng trang bị trùng nhãn */
const duplicate_page_count = computed(
  () => processed_label_data.value.duplicate_page_count
)

/** Số lượng nhãn bị trùng lặp giữa các trang */
const duplicate_label_count = computed(
  () => processed_label_data.value.duplicate_label_count
)

/**chặn các nhãn đã được bên đối diện lựa chọn */
function isDisableLabel(item: ILabel & { _ids?: string[] }) {
  /**dữ liệu filter */
  const FILTER = conversationStore.option_filter_page_data

  // Nếu là nhóm, disable nếu bất kỳ id nào trong nhóm bị chặn (bởi Tag_id)
  if (item._ids) {
    return item._ids.some(id => FILTER.label_id?.includes(id))
  }

  // nếu bên lọc nhãn đã chọn thì bỏ qua
  return FILTER.label_id?.includes(item._id)
}
/** Chọn nhãn */
function selectLabel(item: ILabel & { _ids?: string[] }) {
  /**dữ liệu filter */
  const FILTER = conversationStore.option_filter_page_data
// nếu không có nhãn được chọn thì dừng
  if (!item) return
  // nếu bên lọc nhãn đã chọn thì bỏ qua
  if (isDisableLabel(item)) return

  // toggle trạng thái chọn
  const new_status = !item.is_selected
  
  const ids_to_toggle = item._ids || [item._id]
  
  label_list.value.forEach(label => {
    if (ids_to_toggle.includes(label._id)) {
      label.is_selected = new_status
    }
  })

  // Cập nhật FILTER.not_label_id
  let current_ids = FILTER.not_label_id || []
  if (new_status) {
    current_ids = uniq([...current_ids, ...ids_to_toggle])
  } else {
    current_ids = current_ids.filter(id => !ids_to_toggle.includes(id))
  }

  // lưu lại id nhãn đã chọn vào store
  FILTER.not_label_id = size(current_ids) ? current_ids : undefined

  // sort đã chọn lên đầu
  label_list.value = sortLabel(label_list.value)
}
/**đưa các label được chọn lên đầu */
function sortLabel(input: ILabel[]) {
  return sortBy(input, 'is_selected').reverse()
}
/** Tìm kiếm nhãn theo tên */ 
const searchLabel = debounce(($event: Event) => {
  // nếu không tìm kiếm thì hiển thị toàn bộ
  if (!label_search_name.value)
    return (label_list.value = sortLabel(map(snap_labels.value)))

  // lọc các nhãn thoả mãn tìm kiếm
  let temp: ILabel[] = map(snap_labels.value).filter((item: ILabel) =>
    nonAccentVn(item.title).includes(nonAccentVn(label_search_name.value))
  )

  label_list.value = sortLabel(temp)
}, 300)
/** Hiển thị nhãn theo page đã chọn */
function filterLabelByPage(page_id: string) {
  if (!page_id) {
    // * Hiển thị toàn bộ label
    label_list.value = label_list.value.map(label => {
      label.show_label = true
      return label
    })
  } else {
    // * Gắn cờ hiển thị từng label theo page đã chọn
    label_list.value = label_list.value.map(label => {
      if (label.fb_page_id === page_id) label.show_label = true
      else label.show_label = false
      return label
    })
  }

  // * Sort lại label
  label_list.value = sortLabel(label_list.value)

  // * Xóa input tìm kiếm nhãn
  label_search_name.value = ''
}
</script>
