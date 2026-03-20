<template>
  <div class="flex flex-col gap-4 min-h-0 flex-grow overflow-hidden">
    <Search
      v-model="search"
      :placeholder="$t('v1.common.search')"
      class_input="bg-white py-2 rounded-md"
      class="flex-shrink-0"
    />
    <div class="flex flex-col gap-4 min-h-0 flex-grow overflow-y-auto">
      <CardItem>
        <template #icon>
          <SquaresPlus class="w-5 h-5" />
        </template>
        <template #title>
          {{ $t('v1.view.main.dashboard.widget.popular') }}
        </template>
        <template #item>
          <div
            class="grid gap-y-3 gap-x-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          >
            <template v-for="widget of widget_list">
              <Item
                v-if="filterWidget(widget)"
                @click="openInstallWidget(widget)"
                :widget="widget"
              />
            </template>
          </div>
        </template>
      </CardItem>
    </div>
  </div>
  <WidgetInfo ref="widget_info_ref" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWidgetStore } from '@/stores'
import {
  get_market_category,
  get_market_widget,
} from '@/service/api/chatbox/n5-app'
import { toastError } from '@/service/helper/alert'
import { waterfall } from 'async'

import WidgetInfo from '@/views/Dashboard/Widget/WidgetInfo.vue'
import Item from '@/views/Dashboard/Widget/Item.vue'
import Search from '@/views/Dashboard/Widget/Search.vue'
import CardItem from '@/components/Main/Dashboard/CardItem.vue'

import SquaresPlus from '@/components/Icons/SquaresPlus.vue'

import type {
  AppInfo,
  WidgetCategoryInfo,
} from '@/service/interface/app/widget'
import type { Cb, CbError } from '@/service/interface/function'
import type { ComponentRef } from '@/service/interface/vue'
import { nonAccentVn } from '@/service/helper/format'

const $emit = defineEmits(['is_loading'])

const widgetStore = useWidgetStore()

/**phân trang */
const LIMIT = 30
/**phân trang */
const skip = ref(0)
/**danh sách widget trên chợ */
const widget_list = ref<AppInfo[]>()
/**ref của modal cài đặt widget */
const widget_info_ref = ref<ComponentRef>()
/**danh sách danh mục */
const categories = ref<WidgetCategoryInfo[]>()
/**giá trị tìm kiếm */
const search = ref('')

onMounted(() => getWidget())

/**mở modal cải đặt widget */
function openInstallWidget(widget: AppInfo) {
  // gán giá trị cho widget được chọn
  widgetStore.selected_widget = widget

  // mở modal
  widget_info_ref.value.toggleModal()
}
/**lấy danh sách widget và danh mục */
function getWidget() {
  waterfall(
    [
      // * loading
      (cb: CbError) => {
        widgetStore.is_loading = true

        cb()
      },
      // * lấy danh mục
      (cb: CbError) =>
        get_market_category({}, (e, r) => {
          // ghi dữ liệu nếu có
          if (r?.length) categories.value = r

          cb()
        }),
      // * lấy danh sách từ api v1
      (cb: CbError) =>
        get_market_widget(
          {
            status: 'APPROVED',
            _type: 'marketplace',
            skip: skip.value,
            limit: LIMIT,
          },
          (e, r) => {
            if (e) return cb(e)

            widget_list.value = r
            cb()
          },
        ),
    ],
    e => {
      widgetStore.is_loading = false

      if (e) return toastError(e)
    },
  )
}
/**lấy danh sách widget khi thay đổi giá trị tìm kiếm */
function filterWidget(widget: AppInfo) {
  // nếu không có giá trị tìm kiếm thì trả về true
  if (!search.value) return true

  /**định dạng tìm kiếm */
  const SEARCH = nonAccentVn(search.value)

  console.log('wwtw')

  // nếu tên hoặc mô tả chứa giá trị tìm kiếm thì trả về true
  return (
    nonAccentVn(widget.name).includes(SEARCH) ||
    nonAccentVn(widget.description).includes(SEARCH)
  )
}
</script>
