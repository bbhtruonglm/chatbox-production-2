import { useConversationStore, usePageStore } from '@/stores'
import { getIframeUrl } from '@/service/function'

import type { AppInstalledInfo } from '@/service/interface/app/widget'
import { container } from 'tsyringe'
import { LocalStorage } from '@/utils/helper/LocalStorage'

/** xử lý logic với danh sách widget */
export function useWidget() {
  const $local_storage = container.resolve(LocalStorage)

  /** store */
  const pageStore = usePageStore()
  const conversationStore = useConversationStore()

  /** danh sách id các widget luôn hiển thị của page hiện tại */
  function getDefaultVisibleWidgets() {
    const DEFAULT_VISIBLE_WIDGETS = $local_storage.getItem(
      'default_visible_widgets',
      {}
    )

    /** id trang hiện tại */
    const PAGE_ID = conversationStore.select_conversation?.fb_page_id || ''

    return DEFAULT_VISIBLE_WIDGETS[PAGE_ID] || []
  }

  /**ẩn hiện widget */
  function toggleWidget(widget: AppInstalledInfo) {
    /** danh sách widget */
    const WIDGET_LIST = pageStore.widget_list
    /** danh sách các widget luôn hiển thị */
    const DEFAULT_VISIBLE_WIDGETS = getDefaultVisibleWidgets()
    /** trạng thái nẩn hiện của widget được truyền vào */
    const IS_CURRENTLY_VISIBLE = widget.is_show

    // nếu widget đang mở thì đóng widget đó thôi
    if (IS_CURRENTLY_VISIBLE) {
      widget.is_show = false
      return
    }

    // nếu là mở thì mở widget đó và đóng tắt cả các widget không phải chế độ luôn hiển thị
    WIDGET_LIST?.forEach(item => {
      // toggle widget được chọn
      if (widget._id === item._id) {
        /**widget được toggle là hiển thị hay tắt */
        const WILL_SHOW = !item.is_show

        item.url = getIframeUrl(item)
        
        // if (!WILL_SHOW && item.snap_app?.is_post_message) {
        //   item.url = getIframeUrl(item)
        // }

        // gán giá trị hiển thị mới
        item.is_show = WILL_SHOW
      }
      // ẩn tất cả các widget còn lại trừ nhưng widget trong danh sách luôn hiển thị
      else if (!DEFAULT_VISIBLE_WIDGETS.includes(item._id)) {
        item.is_show = false
      }
    })
  }

  /** điều chỉnh trạng thái của tất cả widget */
  function toggleAllWidget() {
    /** trong danh sách widget có widget đang mở hay không */
    const IS_SHOW = pageStore.widget_list?.some(item => item.is_show)

    // nếu có thì tắt tất cả widget còn không thì mở tất cả widget
    pageStore.widget_list?.forEach(item => (item.is_show = !IS_SHOW))
  }
  return {
    toggleWidget,
    toggleAllWidget,
  }
}
