/**
 * lib tooltip tự viết
 *
 * cú pháp:
 * v-tooltip.<top | bottom | left | right>="<variable>"
 *
 * ví dụ:
 * v-tooltip.top="$t('v1.common.ghtk')"
 * v-tooltip.bottom="`Xin chào`"
 * tooltip-disabled
 */

import type { App, DirectiveBinding } from 'vue'

import { nextTick } from 'vue'
import { random } from 'lodash'

/**các vị trí hiển thị */
type Position = 'top' | 'right' | 'bottom' | 'left'

/**tạo tooltip cho các div target */
const CREATE_TOOLTIP = (el: HTMLElement, binding: DirectiveBinding): void => {
  // nếu không có nội dung thì thôi
  if (!binding.value) return

  /**vị trí hiển thị */
  let position: Position = 'top'

  // đặt lại vị trí hiển thị nếu cần
  if (binding.modifiers?.right) position = 'right'
  if (binding.modifiers?.bottom) position = 'bottom'
  if (binding.modifiers?.left) position = 'left'

  // thêm dữ liệu vào div
  el.setAttribute('tooltip-position', position)
  el.setAttribute('tooltip-value', binding.value)

  // nếu đã set event rồi thì thôi
  if (el.getAttribute('tooltip')) return

  // đánh dấu đã lắng nghe sự kiên xong
  el.setAttribute('tooltip', 'true')

  // tạo một div mới
  const TOOLTIP_BLOCK = document.createElement('div')

  /**id của tooltip này */
  const TOOLTIP_ID = `${random(1000000, 9999999)}${new Date().getTime()}`

  // thêm các class mặc đinh
  TOOLTIP_BLOCK.classList.add(
    'absolute',
    'z-30',
    'rounded-lg',
    'px-2',
    'py-1',
    'bg-black/75',
    'text-white',
    'text-xs',
    'max-w-[200px]',
    'break-words',
    'v-tooltip',
    `v-tooltip-${TOOLTIP_ID}`,
    `v-tooltip-position-${position}`
  )

  /**danh sách vòng lặp để check div target có còn tồn tại hay không */
  let interval_id_list: number[] = []
  /**loại bỏ vòng lặp check khi tooltip đã ẩn */
  const clear_interval = () =>
    interval_id_list.forEach(interval_id => clearInterval(interval_id))

  // xử lý sự kiện khi di chuột vào mục tiêu
  el.addEventListener('mouseover', function () {
    // chặn hiện nếu cần tắt
    if (el.getAttribute('tooltip-disabled') === 'true') return

    // ghi nội dung
    TOOLTIP_BLOCK.innerHTML = el.getAttribute('tooltip-value') || ''

    // Thêm div vào cuối body
    document.body.appendChild(TOOLTIP_BLOCK)

    // lấy vị trí của block click
    const {
      x: target_x,
      y: target_y,
      width: target_width,
      height: target_height,
    } = el?.getBoundingClientRect()

    // lấy vị trí của tooltip
    const {
      x: block_x,
      y: block_y,
      width: block_width,
      height: block_height,
    } = TOOLTIP_BLOCK?.getBoundingClientRect()

    /**lấy hướng hiện tại được cài đặt */
    const tooltip_position: Position = el.getAttribute(
      'tooltip-position'
    ) as Position
    /**khoảng cách so với mục tiêu */
    const distance = 5

    /** di chuyển vị trí */
    nextTick(() => {
      /** bên phải */
      if (tooltip_position === 'right') {
        /** căn giữa */
        TOOLTIP_BLOCK.style.top = `${
          target_y - block_height / 2 + target_height / 2
        }px`
        TOOLTIP_BLOCK.style.left = `${target_x + target_width + distance}px`
      }
      /** bên dưới */
      if (tooltip_position === 'bottom') {
        /** căn giữa */
        TOOLTIP_BLOCK.style.left = `${
          target_x + target_width / 2 - block_width / 2
        }px`
        TOOLTIP_BLOCK.style.top = `${target_y + target_height + distance}px`
      }
      /** bên trái */
      if (tooltip_position === 'left') {
        /** căn chỉnh vị trí */
        TOOLTIP_BLOCK.style.top = `${
          target_y - block_height / 2 + target_height / 2
        }px`
        TOOLTIP_BLOCK.style.left = `${
          target_x - TOOLTIP_BLOCK.offsetWidth - distance
        }px`
      }
      /** bên trên */
      if (tooltip_position === 'top') {
        /** căn giữa */
        TOOLTIP_BLOCK.style.left = `${
          target_x + target_width / 2 - block_width / 2
        }px`
        TOOLTIP_BLOCK.style.top = `${
          target_y - TOOLTIP_BLOCK.offsetHeight - distance
        }px`
      }
    })

    /** list id interval */
    interval_id_list.push(
      setInterval(() => {
        /** nếu target vẫn trên dom thì bỏ qua */
        if (document.body.contains(el)) return

        /** nếu target đã mất thì loại bỏ toàn bộ tooltip này trên hệ thống */
        Array.from(
          document.getElementsByClassName(`v-tooltip-${TOOLTIP_ID}`)
        ).forEach(element => element?.parentNode?.removeChild(element))

        /** dừng vòng lặp check */
        clear_interval()
      }, 500)
    )
  })

  /** xử lý sự kiện khi di chuột ra ngoài mục tiêu */
  el.addEventListener('mouseleave', function () {
    /** dừng vòng lặp check */
    clear_interval()

    /** xoá div khỏi body */
    try {
      document.body.removeChild(TOOLTIP_BLOCK)
    } catch (e) {}
  })
}

/**tạo ra directive v-tooltip */
export const v_tooltip = (APP: App) =>
  APP.directive('tooltip', {
    mounted: CREATE_TOOLTIP,
    updated: CREATE_TOOLTIP,
  })
