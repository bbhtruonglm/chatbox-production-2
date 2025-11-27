<template>
  <div
    id="chat__right-bar"
    class="w-[400px] h-full flex-shrink-0 overflow-y-auto flex flex-col gap-2"
  >
    <PostRightBar
      v-if="conversationStore.select_conversation?.conversation_type === 'POST'"
    />
    <!-- <PostAnalytic
      v-if="conversationStore.select_conversation?.conversation_type === 'POST'"
    /> -->
    <template v-else>
      <AiJourney />
      <template v-for="(widget, index) of pageStore.widget_list">
        <div
          v-if="!widget.is_hidden"
          :class="{
            'flex-grow': widget.is_show,
          }"
          class="rounded-lg bg-white overflow-hidden flex-shrink-0 flex flex-col group hover:bg-slate-50"
          v-show="view === 'widgets'"
        >
          <button
            @click="toggleWidget(widget)"
            class="w-full py-2.5 px-3 text-sm font-semibold flex items-center justify-between sticky top-0 flex-shrink-0"
          >
            {{ widget.snap_app?.name }}
            <div class="flex gap-3">
              <button
                @click.stop="
                  e => {
                    selected_widget_id = widget._id || ''
                    widget_dropdown_ref?.toggleDropdown(e)
                  }
                "
                class="hidden group-hover:block"
                :class="{
                  '!block':
                    widget._id === selected_widget_id &&
                    widget_dropdown_ref?.is_open,
                }"
              >
                <EllipsisHorizontalIcon
                  v-if="index || widget_dropdown_ref?.is_open"
                  class="size-5 text-slate-500 hover:text-slate-900"
                  v-tooltip.top="$t('Thiết lập')"
                />
                <EllipsisHorizontalIcon
                  v-else
                  class="size-5 text-slate-500 hover:text-slate-900"
                  v-tooltip.bottom="$t('Thiết lập')"
                />
              </button>
              <button class="hover:bg-slate-100 mr-1 h-fit p-0.5 rounded">
                <ChevronDownIcon
                  :class="{
                    '-rotate-90': !widget.is_show,
                  }"
                  class="size-4 text-slate-500 duration-300"
                />
              </button>
            </div>
          </button>
          <div
            v-if="widget.is_show"
            :class="
              widget.app_installed_size === 'FULL'
                ? 'min-h-[calc(100vh_-_132px)]'
                : 'min-h-[300px]'
            "
            class="w-full border-t flex-grow"
          >
            <iframe
              :id="`widget-${widget._id}`"
              class="w-full h-full"
              :src="widget.url"
              frameborder="0"
              allow="microphone; camera; autoplay; speaker"
            />
          </div>
        </div>
      </template>
      <WidgetSorting
        :back-to-list="() => (view = 'widgets')"
        v-show="view === 'sorting'"
      />
    </template>

    <Dropdown
      ref="widget_dropdown_ref"
      width="220px"
      height="auto"
      :is_fit="false"
      :back="180"
      class_content="flex flex-col gap-1 rounded-md p-1 gap-1 font-medium text-sm"
    >
      <div
        @click="openWidgetSorting"
        class="flex gap-3 items-center cursor-pointer py-1.5 px-2 rounded-md hover:bg-slate-100"
      >
        <div class="p-1.5 rounded-full bg-gray-100">
          <Square3Stack3DIcon class="size-5" />
        </div>
        <p>{{ $t('Chỉnh sửa vị trí') }}</p>
      </div>
      <div
        @click="change_mode_dropdown_ref?.toggleDropdown"
        class="flex gap-3 items-center cursor-pointer py-1.5 px-2 rounded-md hover:bg-slate-100"
      >
        <div class="p-1.5 rounded-full bg-gray-100">
          <RectangleStackIcon
            v-if="current_visible_widgets.includes(selected_widget_id)"
            class="size-5"
          />
          <RectangleGroupIcon
            v-else
            class="size-5"
          />
        </div>
        <div class="flex justify-between items-center w-full">
          <p v-if="current_visible_widgets.includes(selected_widget_id)">
            {{ $t('Luôn hiển thị') }}
          </p>
          <p v-else>{{ $t('Hiển thị tự động') }}</p>
          <ChevronDownIcon class="size-4" />
        </div>
      </div>
      <div
        v-if="is_admin"
        class="border-t h-1"
      ></div>
      <div
        v-if="is_admin"
        @click="openWidgetStore"
        class="flex gap-3 items-center cursor-pointer py-1.5 px-2 rounded-md hover:bg-slate-100"
      >
        <div class="p-1.5 rounded-full bg-gray-100">
          <Squares2X2Icon class="size-5" />
        </div>
        <p>{{ $t('Quản lý ứng dụng') }}</p>
      </div>
    </Dropdown>

    <Dropdown
      ref="change_mode_dropdown_ref"
      width="220px"
      :back="10"
      height="auto"
      :is_fit="false"
      class_content="flex flex-col gap-1 rounded-md p-1 gap-1 font-medium text-sm"
    >
      <div
        @click="changeModeWidgetView('ALWAYS')"
        class="flex gap-3 items-center cursor-pointer py-1.5 px-2 rounded-md hover:bg-slate-100"
      >
        <div class="p-1.5 rounded-full bg-gray-100">
          <RectangleStackIcon class="size-5" />
        </div>
        <div class="flex justify-between w-full gap-2 min-w-0">
          <p>{{ $t('Luôn hiển thị') }}</p>
          <CheckIcon
            v-if="current_visible_widgets.includes(selected_widget_id)"
            class="size-4"
          />
        </div>
      </div>
      <div
        @click="changeModeWidgetView('AUTO')"
        class="flex gap-3 items-center cursor-pointer py-1.5 px-2 rounded-md hover:bg-slate-100"
      >
        <div class="p-1.5 rounded-full bg-gray-100">
          <RectangleGroupIcon class="size-5" />
        </div>
        <div class="flex justify-between w-full gap-2 min-w-0">
          <p>{{ $t('Hiển thị tự động') }}</p>
          <CheckIcon
            v-if="!current_visible_widgets.includes(selected_widget_id)"
            class="size-4"
          />
        </div>
      </div>
    </Dropdown>
  </div>
</template>
<script setup lang="ts">
import { getIframeUrl, getPageWidget } from '@/service/function'
import { copy } from '@/service/helper/format'
import { useConversationStore, useOrgStore, usePageStore, useWidgetStore } from '@/stores'
import { LocalStorage } from '@/utils/helper/LocalStorage'
import { sortBy } from 'lodash'
import { container } from 'tsyringe'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import Dropdown from '@/components/Dropdown.vue'
import AiJourney from '@/views/ChatWarper/Chat/CenterContent/MessageList/AiJourney.vue'
import PostRightBar from '@/views/ChatWarper/Chat/RightBar/PostRightBar.vue'
import WidgetSorting from '@/views/ChatWarper/Chat/RightBar/WidgetSorting.vue'
import { useWidget } from '@/views/composables/useWidget'

import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import {
  EllipsisHorizontalIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/solid'

import type { AppInstalledInfo } from '@/service/interface/app/widget'

const $router = useRouter()

const conversationStore = useConversationStore()
const pageStore = usePageStore()
const orgStore = useOrgStore()
const widgetStore = useWidgetStore()

/** quản lý local */
const $local_storage = container.resolve(LocalStorage)

/** màn hình hiển thị
 * - widgets: danh sách widget
 * - sorting: sắp xếp widget
 */
const view = ref<'widgets' | 'sorting'>('widgets')

/** ref của dropdown widget */
const widget_dropdown_ref = ref<InstanceType<typeof Dropdown>>()

/**ref của dropdown change mode */
const change_mode_dropdown_ref = ref<InstanceType<typeof Dropdown>>()

/** các widget hiển thị mặc định */
const default_visible_widgets = ref<Record<string, string[]>>(
  $local_storage.getItem('default_visible_widgets', {})
)

/** id widget đang chọn */
const selected_widget_id = ref<string>('')

/** danh sách widget hiển thị của page hiện tại */
const current_visible_widgets = computed(() => {
  /** id trang hiện tại */
  const PAGE_ID = conversationStore.select_conversation?.fb_page_id

  return default_visible_widgets.value?.[PAGE_ID || ''] || []
})

/** trạng thái của tài khoản hiện tại có phải là admin hay ko? */
const is_admin = computed(() => conversationStore.isCurrentStaffAdmin())
// composables
const { toggleWidget } = useWidget()

watch(
  () => conversationStore.list_widget_token?.data,
  () => getListWidget()
)

/**đọc danh sách các widget của trang này */
async function getListWidget() {
  /**id trang */
  const PAGE_ID = conversationStore.select_conversation?.fb_page_id
  /**danh sách token của widget */
  const LIST_WIDGET_TOKEN = conversationStore.list_widget_token

  // nếu không có id trang thì thôi
  if (!PAGE_ID) return

  if (
    // nếu vẫn trong 1 trang và
    LIST_WIDGET_TOKEN.new_page_id === LIST_WIDGET_TOKEN.old_page_id &&
    // đã có dữ liệu widget rồi
    pageStore.widget_list?.length
  )
    // loop danh sách widget hiện tại để xử lý
    return pageStore.widget_list.map(widget => {
      // tạo lại url và trigger reload lại iframe nếu có thể khi
      if (
        // widget ở dạng cũ
        !widget.snap_app?.is_post_message ||
        // hoặc widget không hiển thị - không sợ bị reload
        !widget.is_show
      ) {
        // reload lại iframe từ đầu
        widget.url = getIframeUrl(widget)

        return
      }

      // nếu widget là dạng post mess mới thì không reload iframe nữa mà gửi sự kiện đến iframe
      sendEventToIframe(widget, {
        from: 'CHATBOX',
        type: 'RELOAD',
        payload: {
          access_token:
            conversationStore.list_widget_token?.data?.[widget._id || ''],
          partner_token:
            pageStore.selected_page_list_info?.[
              conversationStore.select_conversation?.fb_page_id!
            ]?.partner_token,
          client_id: conversationStore.select_conversation?.fb_client_id,
        },
      })
    })

  // nếu khác trang, hoặc widget chưa tồn tại

  // đợi vue render xong mới chạy tiếp
  await new Promise(resolve => nextTick(() => resolve(undefined)))

  /**danh sách widget của trang này */
  let temp_list_widget = getPageWidget(PAGE_ID) || []

  // thêm dữ liệu cần thiết cho widget sau khi lọc
  temp_list_widget = temp_list_widget?.map(widget => {
    // nếu có trong danh sách luôn hiện không thì ẩn
    widget.is_show = current_visible_widgets.value?.includes(widget?._id || '')

    // thêm token cho url
    widget.url = getIframeUrl(widget)

    return widget
  })

  // sắp xếp lại danh sách widget theo index
  temp_list_widget = sortBy(temp_list_widget, 'index_position')

  // chỉ hiển thị widget đầu tiên nếu không có widget luôn hiển thị nào
  if (temp_list_widget?.[0] && !current_visible_widgets.value?.length)
    temp_list_widget[0].is_show = true

  // render lại danh sách
  pageStore.widget_list = copy(temp_list_widget)
}
/**gửi sự kiện đến iframe được chọn */
function sendEventToIframe(widget: AppInstalledInfo, payload: any) {
  /**iframe widget mục tiêu */
  const IFRAME = document.getElementById(
    `widget-${widget._id}`
  ) as HTMLIFrameElement

  // gửi sự kiện đến iframe để load lại dữ liệu cần thiết
  IFRAME?.contentWindow?.postMessage(payload, '*')
}

/** mở màn chợ ứng dụng */
function openWidgetStore() {
  /** id trang hiện tại */
  const PAGE_ID = conversationStore.select_conversation?.fb_page_id || ''

  /** id của tổ chức hiện tại */
  const ORG_ID = pageStore.map_orgs?.map_page_org?.[PAGE_ID] || ''

  // chọn trang hiện tại
  widgetStore.selected_page_id = PAGE_ID

  // chọn tổ chức hiện tại
  orgStore.selected_org_id = ORG_ID

  // chuyển sang màn widget đã cài đặt
  $router.push(`/dashboard/widget/installed`)
}

/** mở màn sắp xếp thứ tự widget */
function openWidgetSorting() {
  // lưu giá trị là màn sắp xếp thứ tự widget
  view.value = 'sorting'

  // toggle trạng thái của dropdown
  widget_dropdown_ref.value?.toggleDropdown()
}

/** hàm đổi chế độ hiển thị của widget
 * @param widget : widget mục tiêu
 * @param type : luôn hiển thị (ALWAYS) hoặc tự động (AUTO)
 */
function changeModeWidgetView(type: 'ALWAYS' | 'AUTO') {
  /** id trang hiện tại */
  const PAGE_ID = conversationStore.select_conversation?.fb_page_id

  /** id widget mức tiêu */
  const WIDGET_ID = selected_widget_id.value

  // nếu không có id widget hoặc id trang thì thôi
  if (!WIDGET_ID || !PAGE_ID) return

  /** danh sách id các widget luôn hiển thị */
  const WIDGET_IDS = default_visible_widgets.value?.[PAGE_ID || ''] || []

  // nếu là luôn hiện thì thêm vào mảng
  if (type === 'ALWAYS') {
    default_visible_widgets.value[PAGE_ID || ''] = [...WIDGET_IDS, WIDGET_ID]
    openWidget(WIDGET_ID)
  }

  // nếu là tự động thì xóa khỏi mảng
  if (type === 'AUTO') {
    default_visible_widgets.value[PAGE_ID || ''] = WIDGET_IDS.filter(
      (id: string) => id !== WIDGET_ID
    )
  }

  // tắt dropdown thay đổi chế độ hiển thị
  change_mode_dropdown_ref.value?.toggleDropdown()

  // tắt dropdown widget
  widget_dropdown_ref.value?.toggleDropdown()

  // lưu lại danh sách mới vào localStorag
  $local_storage.setItem(
    'default_visible_widgets',
    default_visible_widgets.value
  )

  // clear id widget hien tai
  selected_widget_id.value = ''
}

/** mở widget với id */
function openWidget(widget_id: string) {
  pageStore.widget_list?.forEach(widget => {
    if (widget._id === widget_id) widget.is_show = true
  })
}
</script>
