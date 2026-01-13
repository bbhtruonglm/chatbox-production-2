import type {
  ConversationInfo,
  ConversationList,
  FilterConversation,
} from '@/service/interface/app/conversation'
import type { IPost, IPostAnalytic } from '@/service/interface/app/message'
import { getLocal, saveLocal } from '@/service/helper/store'

import type { AppInstalledInfo } from '@/service/interface/app/widget'
import type { ClientInfo } from '@/utils/api/Chatbot'
import type { ILabel } from '@/service/interface/app/label'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useExtensionStore } from '@/stores'
import { useOrgStore } from '@/stores/dashboard'
import { usePageStore } from '@/stores/page'
import { useRoute } from 'vue-router'

export const useConversationStore = defineStore('conversation_store', () => {
  /** router */
  const $route = useRoute()

  const extensionStore = useExtensionStore()

  /**lưu dữ liệu lọc hội thoại */
  const option_filter_page_data = ref<FilterConversation>(
    getOptionFilterPageData()
  )

  // lưu dữ liệu xuống local
  saveLocal(option_filter_page_data, 'option_filter_page_data')

  /**dữ liệu của 1 khách hàng khi được chọn */
  const select_conversation = ref<ConversationInfo>()
  /**dữ liệu bài post của hội thoại dạng post đang được chọn */
  const select_conversation_post = ref<IPost>()
  /**thống kê bài viết đang được chọn */
  const select_conversation_post_analytic = ref<IPostAnalytic>()

  /** id của page vừa phản hồi */
  const selected_client_id = ref<string>()
  /** Trạng thái clear conversation */
  const is_clearing_conversation = ref<boolean>(false)
  /** Trạng thái thay đổi select conversation */
  const is_switching_conversation = ref<boolean>(false)

  /** lấy dữ liệu lọc hội thoại */
  function getOptionFilterPageData(): FilterConversation {
    /** dữ liệu lọc hội thoại lấy ở localstorage */
    let option_filter_page_data = getLocal('option_filter_page_data', {
      is_spam_fb: 'NO',
      conversation_type: 'CHAT',
    })

    // kiểm tra query string có tab bằng post hay không
    if ($route.query.tab === 'POST') {
      option_filter_page_data.conversation_type = 'POST'
    }
    // nếu không có thì mặc định là tab chat
    else {
      option_filter_page_data.conversation_type = 'CHAT'
    }

    return option_filter_page_data
  }

  /**lấy thông tin nhân viên được gán cho hội thoại này */
  function getAssignStaff() {
    const pageStore = usePageStore()

    // lấy thông tin nhân viên được gán
    return pageStore.getStaff(
      select_conversation.value?.fb_page_id,
      select_conversation.value?.user_id ||
        select_conversation.value?.fb_staff_id
    )
  }
  /**kiểm tra staff hiện tại có phải là admin của page hoặc admin của tổ chức của hội thoại này không */
  function isCurrentStaffAdmin() {
    const pageStore = usePageStore()
    const orgStore = useOrgStore()

    // trả về kết quả kiểm tra
    return (
      pageStore.isCurrentStaffAdmin(select_conversation.value?.fb_page_id) ||
      orgStore.isAdminOrg()
    )
  }
  /**lấy dữ liệu trang của hội thoại này */
  function getPage() {
    const pageStore = usePageStore()

    // trả về dữ liệu trang
    return pageStore.getPage(select_conversation.value?.fb_page_id)?.page
  }

  /** lấy dữ liệu trang với id trang trong hội thoại */
  function getPageById(page_id: string) {
    const pageStore = usePageStore()

    // trả về dữ liệu trang
    return pageStore.getPage(page_id)?.page
  }

  /**lấy danh sách nhãn của trang của hội thoại này */
  function getLabels(): Record<string, ILabel> | undefined {
    const pageStore = usePageStore()

    // trả về danh sách nhãn
    return pageStore.getLabels(select_conversation.value?.fb_page_id)
  }
  /**
   * danh sách các id nhãn đang kích hoạt của hội thoại
   * - đã lọc ra các id nhãn đã bị xóa
   */
  function getActiveLabelIds() {
    /**các nhãn của trang của hội thoại này */
    const LABELS = getLabels()

    // lọc các id nhãn còn tồn tại của trang
    return select_conversation.value?.label_id?.filter(
      label_id => LABELS?.[label_id]
    )
  }

  /**đang load danh sách hội thoại */
  const is_loading_list = ref(true)

  /**danh sách hội thoại đang hiển thị */
  const conversation_list = ref<ConversationList>({})

  /** số lượng các hội thoại của các trang đã chọn và bộ lọc đã lọc */
  const count_conversation = ref<{
    /** số lượng hội thoại chat */
    chat: number
    /** số lượng hội thoại post */
    post: number
  }>({
    chat: 0,
    post: 0,
  })

  /**widget được chọn để mở */
  const select_widget = ref<AppInstalledInfo>()

  /**danh sách token của widget */
  const list_widget_token = ref<{
    /**id trang hiện tại */
    new_page_id?: string
    /**id trang trước đó */
    old_page_id?: string
    /**dữ liệu token */
    data?: {
      [index: string]: string
    }
  }>({})

  /**có đang bật cờ chỉnh sửa dữ liệu khách hàng không */
  const is_edit_info = ref<boolean>(false)

  /**dữ liệu của khách hàng này bên chatbot */
  const chatbot_client = ref<ClientInfo>()

  /**gắn cờ có sửa dữ liệu không */
  const is_edit_client = ref<{
    /**sửa tên */
    client_name?: boolean
    /** sửa giới tính */
    client_gender?: boolean
    /**danh sách id liên hệ bị xoá */
    contact_remove: Record<string, 1>
    /**danh sách id liên hệ cập nhật */
    contact_update: Record<string, 1>
    /**danh sách id liên hệ thêm mới */
    contact_create: Record<string, 1>
  }>({
    contact_remove: {},
    contact_update: {},
    contact_create: {},
  })

  /**kiểm tra xem có đang tìm kiếm thông tin khách hàng hay không */
  function isFindClientInfo() {
    /** key duy nhất hội thoại */
    const DATA_KEY = select_conversation.value?.data_key

    // nếu chưa chọn cuộc trò chuyện nào thì không hiển thị
    if (!DATA_KEY) return false

    // trả về trạng thái có đang tìm kiếm thông tin khách hàng hay không
    return extensionStore.is_find_client_info?.[DATA_KEY]
  }
  /** bộ lọc nhanh đã chọn */
  const selected_quick_filter = ref('ALL')

  return {
    selected_quick_filter,
    option_filter_page_data,
    select_conversation,
    select_conversation_post,
    select_conversation_post_analytic,
    conversation_list,
    count_conversation,
    select_widget,
    list_widget_token,
    is_edit_info,
    chatbot_client,
    is_edit_client,

    getAssignStaff,
    isCurrentStaffAdmin,
    getLabels,
    getActiveLabelIds,
    getPage,
    getPageById,
    isFindClientInfo,
    selected_client_id,
    is_clearing_conversation,
    is_switching_conversation,
    is_loading_list,
  }
})
