import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  saveIndexedDB,
  getIndexedDB,
  removeIndexedDB,
} from '@/service/helper/store'
import { saveLocal, getLocal } from '@/service/helper/store'

import type { PageData, PageList } from '@/service/interface/app/page'
import { filter, map, pickBy, set, size } from 'lodash'
import type {
  AppInfo,
  AppInstalledInfo,
  ListPageIsInstall,
} from '@/service/interface/app/widget'
import type { StaffInfo } from '@/service/interface/app/staff'
import type {
  OwnerShipInfo,
  PageOrgInfoMap,
} from '@/service/interface/app/billing'
import type { ILabel } from '@/service/interface/app/label'
import { usePageManager } from '@/views/Dashboard/composables/usePageManager'
import {
  useOrgStore,
  usePageManagerStore,
  useSelectPageStore,
} from './dashboard'

export const usePageStore = defineStore('page_store', () => {
  /** -------------- STAGE -------------- */

  const orgStore = useOrgStore()
  const pageManagerStore = usePageManagerStore()
  const selectPageStore = useSelectPageStore()

  const { filterPageByPlatform, filterPageBySearch } = usePageManager()

  /** dữ liệu của tất cả các page người dùng cho thể truy cập */
  const all_page_list = ref<PageList>({})

  // đọc dữ liệu được lưu ở indexeddb
  getIndexedDB('all_page_list', undefined, (e, r) => (all_page_list.value = r))
  // lưu dữ liệu xuống indexed khi có thay đổi
  saveIndexedDB(all_page_list, 'all_page_list')

  /**mapping trang và tổ chức */
  const map_orgs = ref<PageOrgInfoMap>()

  /** lưu dữ liệu của các page được kích hoạt của user này */
  // const active_page_list = ref<PageList>({})
  const active_page_list = computed({
    get: () => {
      /** dữ liệu các page sau khi lọc */
      let result = all_page_list.value

      console.log(result, 'result')
      // lọc theo nền tảng đang chọn
      result = filterPageByPlatform(result, selectPageStore.current_menu)
      // lọc theo tìm kiếm
      result = filterPageBySearch(result, selectPageStore.search)
      return result
    },
    set: val => {
      active_page_list.value = val
    },
  })

  // đọc dữ liệu được lưu ở indexeddb
  getIndexedDB('active_page_list', undefined, (e, r) => {
    if (r) removeIndexedDB('active_page_list')
  })
  // lưu dữ liệu xuống indexed khi có thay đổi
  // saveIndexedDB(active_page_list, 'active_page_list')

  // đọc dữ liệu được lưu ở indexeddb
  getIndexedDB('map_orgs', undefined, (e, r) => (map_orgs.value = r))
  // lưu dữ liệu xuống indexed khi có thay đổi
  saveIndexedDB(map_orgs, 'map_orgs')

  /**lưu id của các page được chọn để chat */
  const selected_page_id_list = ref<{
    [index: string]: boolean | undefined
  }>(getLocal('selected_page_id_list', {}))
  // lưu dữ liệu xuống local
  saveLocal(selected_page_id_list, 'selected_page_id_list')

  /**dữ liệu của các page được chọn khi vào trang chat */
  const selected_page_list_info = ref<PageList>({})

  /**lấy dữ liệu của nhân viên của trang */
  function getStaff(
    page_id?: string,
    staff_id?: string
  ): StaffInfo | undefined {
    // nếu không có page_id hoặc staff_id thì thôi
    if (!page_id || !staff_id) return

    // trả về thông tin nhân viên
    return selected_page_list_info.value?.[page_id]?.staff_list?.[staff_id]
  }
  /**đọc dữ liệu của 1 trang nằm trong các trang đang được chọn */
  function getPage(page_id?: string): PageData | undefined {
    // nếu không có page_id thì thôi
    if (!page_id) return

    // trả về thông tin trang
    return selected_page_list_info.value?.[page_id]
  }
  /**lấy thông tin nhân viên hiện tại đang đăng nhập của trang */
  function getCurrentStaff(page_id?: string): StaffInfo | undefined {
    // nếu không có page_id thì thôi
    if (!page_id) return

    // trả về thông tin nhân viên hiện tại
    return getPage(page_id)?.current_staff
  }
  /**kiểm tra staff hiện tại có phải là admin của page không */
  function isCurrentStaffAdmin(page_id?: string) {
    // nếu không có page_id hoặc staff_id thì thôi
    if (!page_id) return false

    /**trang hiện tại */
    const PAGE = getPage(page_id)
    /**nhân viên hiện tại */
    const STAFF = getCurrentStaff(page_id)

    // nếu không có trang hoặc nhân viên thì thôi
    if (!PAGE?.group_admin_id || !STAFF) return false

    // kiểm tra staff có nằm trong nhóm admin không
    if (!STAFF?.group_staff?.includes(PAGE?.group_admin_id)) return false

    // nếu là admin thì trả về true
    return true
  }

  /** kiểm tra staff hiện tại có phỉa admin của page hoặc là admin của tổ chức */
  function isPageAdminOrOrgAdmin(page_id?: string): boolean {
    return isCurrentStaffAdmin(page_id) || orgStore.isAdminOrg()
  }

  /**lấy danh sách nhãn của trang */
  function getLabels(page_id?: string): Record<string, ILabel> | undefined {
    // nếu không có page_id thì thôi
    if (!page_id) return

    // trả về thông tin trang
    return selected_page_list_info.value?.[page_id]?.label_list
  }

  /**dữ liệu của các nhân viên của các trang đang được chọn */
  const selected_pages_staffs = ref<Record<string, StaffInfo>>({})

  /**danh sách widget */
  const widget_list = ref<AppInstalledInfo[]>([])

  /**các widget trên chợ */
  const market_widgets = ref<Record<string, AppInfo>>()

  /**các trang zalo cá nhân của tổ chức đang được chọn dể chat */
  const zlp_oss = ref<OwnerShipInfo[]>()

  /**--------------- GETTER ------------ */
  /**đếm số trang đang kích hoạt của tổ chức đã chọn */
  function countActivePage() {
    // nếu là tất cả tổ chức
    if (!orgStore.selected_org_id) return size(active_page_list.value)

    // nếu chọn 1 tổ chức nào đó
    const PAGE_LIST = filter(active_page_list.value, page => {
      /** id của page */
      const PAGE_ID = page?.page?.fb_page_id || ''

      return (
        map_orgs.value?.map_page_org?.[PAGE_ID] === orgStore.selected_org_id
      )
    })

    return size(PAGE_LIST)
  }
  /**đếm số lượng page được chọn */
  function countSelectedPage() {
    // lọc ra các page được chọn
    return filter(selected_page_id_list.value, value => !!value)?.length
  }
  /**kiểm tra xem page_id có trong danh sách được chọn không */
  function isSelectedPage(page_id?: string) {
    // nếu không có page_id thì tính là chưa chọn
    if (!page_id) return false

    // kiểm tra xem page_id có trong danh sách được chọn không
    return !!selected_page_id_list.value[page_id]
  }

  /** -------------- MUTATION / ACTION -------------- */
  function setPageSelected(page_id?: string, is_selected?: boolean) {
    // nếu page_id không tồn tại thì thôi
    if (!page_id) return

    // ghi trang thái mới
    if (is_selected) selected_page_id_list.value[page_id] = true
    // ghi trang thái mới
    else delete selected_page_id_list.value[page_id]
  }

  return {
    all_page_list,
    active_page_list,
    selected_page_id_list,
    selected_page_list_info,
    widget_list,
    selected_pages_staffs,
    market_widgets,
    map_orgs,
    zlp_oss,

    countSelectedPage,
    isSelectedPage,
    setPageSelected,
    countActivePage,
    getStaff,
    getPage,
    isCurrentStaffAdmin,
    isPageAdminOrOrgAdmin,
    getCurrentStaff,
    getLabels,
  }
})
