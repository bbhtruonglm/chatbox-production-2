<template>
  <LowPermision v-if="!orgStore.isAdminOrg()" />
  <EmptyActive
    v-else-if="
      !size(list_my_org_page) &&
      !size(list_another_org_page) &&
      !size(list_free_page)
    "
  />
  <template v-else>
    <div class="h-full p-2 overflow-y-auto flex flex-col gap-2.5">
      <div class="grid grid-cols-2 gap-x-6 gap-y-2.5">
        <template v-for="page of list_free_page">
          <PageItem
            @click="selectPage(page)"
            v-if="page?.page?.fb_page_id && filterPage(page)"
            v-model:checkbox="list_selected_page_id[page?.page?.fb_page_id]"
            :checkbox_is_visible="true"
            :checkbox_is_disabled="!isPageAdmin(page)"
            :page_info="page?.page"
            v-tooltip.top="
              $t('v1.view.main.dashboard.select_platform.low_permission')
            "
            :tooltip-disabled="isPageAdmin(page)"
            :class="
              isPageAdmin(page)
                ? 'cursor-pointer'
                : 'grayscale cursor-not-allowed'
            "
          >
          </PageItem>
        </template>
      </div>
      <div class="grid grid-cols-2 gap-x-6 gap-y-2.5">
        <template v-for="page of list_my_org_page">
          <PageItem
            @click="selectPage(page)"
            v-if="page?.page?.fb_page_id && filterPage(page)"
            v-model:checkbox="list_selected_page_id[page?.page?.fb_page_id]"
            :checkbox_is_visible="true"
            :checkbox_is_disabled="!isPageAdmin(page)"
            :page_info="page?.page"
            v-tooltip.top="
              $t('v1.view.main.dashboard.select_platform.low_permission')
            "
            :tooltip-disabled="isPageAdmin(page)"
            :class="
              isPageAdmin(page)
                ? 'cursor-pointer'
                : 'grayscale cursor-not-allowed'
            "
          >
          </PageItem>
        </template>
      </div>
      <SplitTitle
        v-if="list_another_org_page?.length"
        :title="$t('v1.view.main.dashboard.select_platform.another_page')"
      />
      <div v-for="org of map_another_org_page?.map_org_info">
        <div>
          <div class="text-sm font-semibold">
            {{ org?.org_info?.org_name }}:
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2.5">
          <template v-for="page of list_another_org_page">
            <PageItem
              @click="selectPage(page)"
              v-if="
                page?.page?.fb_page_id &&
                filterPage(page) &&
                map_another_org_page?.map_org_page?.[org?.org_id!]?.[
                  page?.page?.fb_page_id
                ]
              "
              v-model:checkbox="list_selected_page_id[page?.page?.fb_page_id]"
              :checkbox_is_visible="true"
              :checkbox_is_disabled="!isPageAdmin(page)"
              :page_info="page?.page"
              v-tooltip.top="
                $t('v1.view.main.dashboard.select_platform.low_permission')
              "
              :tooltip-disabled="isPageAdmin(page)"
              :class="
                isPageAdmin(page)
                  ? 'cursor-pointer'
                  : 'grayscale cursor-not-allowed'
              "
            >
            </PageItem>
          </template>
        </div>
      </div>
    </div>
    <div class="flex-shrink-0 flex p-2 border-t justify-end">
      <Button
        @click="beforeActivePage"
        :class="
          countPageSelect() && !isOverQuota()
            ? 'bg-blue-700 text-white'
            : 'cursor-not-allowed bg-slate-200 text-slate-500'
        "
      >
        {{ $t('v1.view.main.dashboard.select_platform.active') }}
      </Button>
    </div>
  </template>
  <AlertOverQuota
    @done="$emit('close')"
    ref="alert_over_quota_ref"
  />
  <ConfirmTakePage
    @done="addPageToOrg"
    ref="confirm_take_page_ref"
    :another_pages_name
  />
</template>
<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue'
import {
  useCommonStore,
  useConnectPageStore,
  useOrgStore,
  useChatbotUserStore,
} from '@/stores'
import { filter, keyBy, map, mapValues, size } from 'lodash'
import { update_page } from '@/service/api/chatbox/n4-service'
import { eachOfLimit } from 'async'
import { KEY_TOGGLE_MODAL_FUNCT } from '@/views/Dashboard/ConnectPage/symbol'
import { nonAccentVn } from '@/service/helper/format'
import { read_os, read_link_org, add_os } from '@/service/api/chatbox/billing'
import { confirmSync, toastError } from '@/service/helper/alert'
import {
  N4SerivceAppPage,
  type CurrentPageData,
} from '@/utils/api/N4Service/Page'
import { useI18n } from 'vue-i18n'

import Button from '@/views/Dashboard/ConnectPage/Button.vue'
import PageItem from '@/components/Main/Dashboard/PageItem.vue'
import EmptyActive from '@/views/Dashboard/ConnectPage/ActivePage/EmptyActive.vue'
import LowPermision from '@/views/Dashboard/ConnectPage/ActivePage/LowPermision.vue'
import SplitTitle from '@/views/Dashboard/ConnectPage/ActivePage/SplitTitle.vue'
import AlertOverQuota from '@/views/Dashboard/ConnectPage/ActivePage/AlertOverQuota.vue'
import ConfirmTakePage from '@/views/Dashboard/ConnectPage/ActivePage/ConfirmTakePage.vue'

import type { PageData } from '@/service/interface/app/page'
import type {
  OrgInfo,
  OwnerShipInfo,
  PageOrgInfoMap,
} from '@/service/interface/app/billing'
import { Page } from '@/utils/helper/Page'
import { ToastSingleton } from '@/utils/helper/Alert/Toast'

const $emit = defineEmits(['done', 'close'])

const connectPageStore = useConnectPageStore()
const commonStore = useCommonStore()
const orgStore = useOrgStore()
const chatbotUserStore = useChatbotUserStore()
const { t: $t } = useI18n()

/**ẩn hiện modal kết nối nền tảng */
const toggleModal = inject(KEY_TOGGLE_MODAL_FUNCT)

/**danh sách các trang thuộc tổ chức của tôi */
const list_my_org_page = ref<PageData[]>([])
/**danh sách các trang ở tổ chức khác */
const list_another_org_page = ref<PageData[]>([])
/**các trang tự do không có tổ chức */
const list_free_page = ref<PageData[]>([])
/**danh sách id các page đã chọn */
const list_selected_page_id = ref<Record<string, boolean>>({})
/**danh sách các trang đã chọn - org id */
const map_my_os = ref<Record<string, string | undefined>>({})
/**danh sách các trang đạng chọn mà ngoài tổ chức */
const list_another_org_page_id = ref<string[]>([])
/**liên kết dữ liệu giữa tổ chức khác và trang */
const map_another_org_page = ref<PageOrgInfoMap>()
/**toàn bộ các trang khả thi */
const list_current_page = ref<CurrentPageData>()
/**thông báo quá giới hạn trang */
const alert_over_quota_ref = ref<InstanceType<typeof AlertOverQuota>>()
/**cảnh báo lấy trang của tổ chức khác */
const confirm_take_page_ref = ref<InstanceType<typeof ConfirmTakePage>>()
/**tên của các trang khác tổ chức của mình */
const another_pages_name = ref<string[]>()

// lấy danh sách page mới
onMounted(() => getListPAGEPage())

// khi thay đổi trang đã chọn thì tính toán lại trang ngoài tổ chức
watch(
  () => list_selected_page_id.value,
  () => getAnotherOrgPage(),
  {
    deep: true,
  }
)

/**kiểm tra xem user có phải là admin trang không */
function isPageAdmin(page: PageData): boolean {
  return Page.isCurrentStaffIsPageAdmin(page)
}
/**hiển thị các page theo tìm kiếm */
function filterPage(page: PageData) {
  // nếu không có giá trị tìm kiếm thì luôn hiển thị
  if (!connectPageStore.search) return true

  /**giá trị tìm kiếm đã được xử lý */
  const SEARCH = nonAccentVn(connectPageStore.search)

  // tìm theo id hoặc tên trang
  return (
    page?.page?.fb_page_id?.includes(SEARCH) ||
    nonAccentVn(page?.page?.name || '')?.includes(SEARCH)
  )
}
/**đếm xem nếu thêm page thì tổng số page mới là bao nhiêu */
function countNewCurrentPage(org?: OrgInfo) {
  /**số page hiện tại trong tổ chức */
  const CURRENT_PAGE = org?.org_package?.org_current_page || 0
  /**số page mới được chọn để thêm vào tổ chức */
  const NEW_PAGE = list_another_org_page_id.value?.length || 0

  // trả về tổng
  return CURRENT_PAGE + NEW_PAGE
}
/**kiểm tra xem có bị quá giới hạn trang của tổ chức không */
function isOverQuota() {
  /**thông tin của tổ chức đang chọn */
  const ORG = orgStore.selected_org_info
  /**giới hạn trang hiện tại */
  const QUOTA = ORG?.org_package?.org_quota_page || 0

  // số trang mới thêm vượt quá giới hạn
  return countNewCurrentPage(ORG) > QUOTA
}
/**lấy danh sách các trang ngoài tổ chức hiện tại */
function getAnotherOrgPage() {
  // lọc ra các id trang ngoài tổ chức hiện tại
  list_another_org_page_id.value = map(
    list_selected_page_id.value,
    (is_selected, page_id) => {
      // bỏ các trang chưa chọn hoặc đang trong tổ chức
      if (!is_selected || map_my_os.value?.[page_id]) return

      // lấy id trang ngoài tổ chức
      return page_id
    }
  )?.filter(Boolean) as string[]
}
/**trước khi kích hoạt trang */
function beforeActivePage() {
  // nếu đã quá hạn mức thì chặn
  if (isOverQuota()) return alert_over_quota_ref.value?.toggleModal()

  // nếu có trang khác tổ chức thì cảnh báo
  if (list_another_org_page_id.value?.length) warningTakeControlPage()
  // nếu không thì chỉ kích hoạt hiển thị, không cần thêm lại tổ chức nữa
  else activePage()
}
/**cảnh báo khi người dùng sắp lấy page của tổ chức khác */
async function warningTakeControlPage() {
  // nếu không chọn tổ chức thì không thể tiếp tục
  if (!orgStore.selected_org_id) return

  /**danh sách tên các trang đã có tổ chức */
  another_pages_name.value = list_another_org_page_id.value
    // lọc các trang có tổ chức khác
    ?.filter(page_id => map_another_org_page.value?.map_page_org?.[page_id])
    // lọc tên trang
    ?.map(
      page_id => list_current_page.value?.page_list?.[page_id]?.page?.name
    ) as string[]

  // cảnh báo lấy trang của tổ chức khác
  if (another_pages_name.value?.length)
    confirm_take_page_ref.value?.toggleModal()
  // nếu đều là trang vô chủ thì thêm trang vào tổ chức luôn
  else addPageToOrg()
}
/**thêm trang vào tổ chức này */
async function addPageToOrg() {
  try {
    // nếu không chọn tổ chức thì không thể tiếp tục
    if (!orgStore.selected_org_id) return

    // hiển thị loading
    commonStore.is_loading_full_screen = true

    // thêm trang các vào tổ chức
    await eachOfLimit(
      list_another_org_page_id.value,
      1,
      async (page_id, i) =>
        await add_os(orgStore.selected_org_id!, page_id as string)
    )

    // kích hoạt trang
    activePage()
  } catch (e) {
    // nếu quá giới hạn thì thông báo
    alert_over_quota_ref.value?.toggleModal()
    // thông báo lỗi
    // toastError(e)
  } finally {
    // ẩn loading
    commonStore.is_loading_full_screen = false
  }
}

/**kích hoạt các trang được chọn */
async function activePage() {
  try {
    // nếu không có trang nào được chọn thì bỏ qua
    if (!countPageSelect()) return

    // hiển thị loading
    commonStore.is_loading_full_screen = true

    // lặp qua từng trang được chọn
    await eachOfLimit(
      list_selected_page_id.value,
      1,
      (value, page_id, next) => {
        // nếu trang không được chọn thì bỏ qua
        if (!value) return next()

        // kích hoạt trang
        update_page(
          {
            page_id: page_id as string,
            is_active: true,
          },
          (e, r) => {
            if (e) return next(e)

            next()
          }
        )
      }
    )

    // làm mới danh sách trang được chọn
    list_selected_page_id.value = {}

    // thông báo ra modal là đã xong
    $emit('done')

    // tắt modal kết nối nền tảng
    await toggleModal?.()
  } catch (e) {
    // thông báo lỗi
    toastError(e)
  } finally {
    // ẩn loading
    commonStore.is_loading_full_screen = false
  }
}
/** Tạo map của tổ chức đang chọn với các trang của nó */
async function getMapMyOs() {
  /** danh sách các trang thuộc các tổ chức của tôi */
  const list_my_os: OwnerShipInfo[] = []

  const listOrg = orgStore.list_org || [] // fallback nếu undefined

  await eachOfLimit(listOrg, 1, async (org: OrgInfo, i) => {
    if (!org.org_id) return
    const LIST_OS = (await read_os(org.org_id)) || []
    list_my_os.push(...LIST_OS)
  })

  /** tạo map page_id -> org_id */
  map_my_os.value = mapValues(keyBy(list_my_os, 'page_id'), 'org_id')
}

/**tính toán ra danh sách page mới và page không có quyền truy cập */
async function getListPAGEPage() {
  try {
    // hiển thị loading
    connectPageStore.is_loading = true

    // xóa toàn bộ các danh sách trang đang có để làm mới
    list_my_org_page.value = []
    list_another_org_page.value = []
    list_free_page.value = []

    // tạo ra map giữa id tổ chức đang chọn và id trang
    await getMapMyOs()

    /**toàn bộ các trang của người dùng */
    list_current_page.value = await new N4SerivceAppPage().getListPage({
      is_disable_filter: true,
    })

    /**danh sách các trang không phải trong tổ chức của tôi */
    let list_not_my_org_page: PageData[] = []

    // lặp qua toàn bộ danh sách page của người dùng
    map(list_current_page.value?.page_list, page => {
      // nếu không có id trang thì thôi
      if (!page?.page?.fb_page_id) return

      // lấy thông tin nhân viên hiện tại của trang
      page.current_staff =
        page?.staff_list?.[
          chatbotUserStore.chatbot_user?.user_id ||
            chatbotUserStore.chatbot_user?.fb_staff_id ||
            ''
        ]

      // thêm trang chưa kích hoạt vào danh sách

      // trang thuộc tổ chức của tôi
      if (map_my_os.value?.[page?.page?.fb_page_id]) {
        // chỉ lấy trang chưa kích hoạt hiển thị
        if (!page?.page?.is_active) list_my_org_page.value.push(page)
      }
      // trang không thuộc tổ chức của tôi
      else list_not_my_org_page.push(page)
    })

    // lấy dữ liệu tổ chức khác
    map_another_org_page.value = await read_link_org(
      list_not_my_org_page?.map(page => page?.page?.fb_page_id || '')
    )

    /**các trang tự do không có tổ chức */
    let temp_list_free_page: PageData[] = []

    // lặp qua các trang ngoài tổ chức đang chọn
    list_not_my_org_page.map(page => {
      // nếu trang không thuộc tổ chức nào
      if (
        !map_another_org_page.value?.map_page_org?.[
          page?.page?.fb_page_id || ''
        ]
      )
        temp_list_free_page.push(page)
      // list_free_page.value.push(page)
      // nếu trang thuộc tổ chức khác
      else list_another_org_page.value.push(page)
    })

    // sắp xếp lại trang tự do, đảo chiều trang mới tạo lên đầu
    list_free_page.value = temp_list_free_page.reverse()
  } catch (e) {
    // thông báo lỗi
    ToastSingleton.getInst().error(e)
  } finally {
    // ẩn loading
    connectPageStore.is_loading = false
  }
}
/**toggle trang */
function selectPage(page: PageData) {
  // nếu không phải là admin thì bỏ qua
  if (!isPageAdmin(page)) return

  /**id của trang */
  const PAGE_ID = page?.page?.fb_page_id || ''

  // thêm hoặc bỏ trang khỏi danh sách trang đang chọn
  list_selected_page_id.value[PAGE_ID] = !list_selected_page_id.value[PAGE_ID]
}
/**đếm số trang đang chọn */
function countPageSelect() {
  /**lọc ra danh sách id các trang đang chọn */
  const LIST_SELECT_PAGE_ID = filter(
    list_selected_page_id.value,
    value => value
  )

  // trả về số lượng id trang đang chọn
  return size(LIST_SELECT_PAGE_ID)
}
</script>
