import type { SocketEvent } from '@/service/interface/app/common'
import type { ConversationInfo } from '@/service/interface/app/conversation'
import type { MessageInfo } from '@/service/interface/app/message'
import type { FacebookCommentPost } from '@/service/interface/app/post'
import type { StaffSocket } from '@/service/interface/app/staff'
import { keys, size } from 'lodash'
import { LocalStorage, type ILocalStorage } from '@/utils/helper/LocalStorage'
import { container } from 'tsyringe'

export class Socket {
  /**kết nối socket đến server */
  private socket: WebSocket | null = null

  /**lưu lại id vòng lặp ping */
  private ping_interval_id: number | null = null

  /**gắn cờ đóng kết nối hoàn toàn */
  private is_force_close_socket: boolean = false

  /**
   * @param SERVICE_LOCAL_STORAGE service quản lý local storage
   */
  constructor(
    private SERVICE_LOCAL_STORAGE: ILocalStorage = container.resolve(
      LocalStorage
    )
  ) {}

  /** Kết nối socket */
  connect(
    url: string,
    selected_page_id_list: string[],
    fb_staff_id: string,
    cb: Function
  ) {
    /** access token của người dùng */
    const TOKEN = this.SERVICE_LOCAL_STORAGE.getItem('access_token')

    // nếu không có token thì dừng lại
    if (!TOKEN) return

    // khởi tạo kết nối socket
    this.socket = new WebSocket(
      `${url}?access_token=${encodeURIComponent(TOKEN)}`
    )

    // khi kết nối thành công
    this.socket.onopen = () => {
      // gửi danh sách page lên socket
      this.socket?.send(
        JSON.stringify({
          list_page: selected_page_id_list,
          fb_staff_id: fb_staff_id,
        })
      )

      this.ping_interval_id = setInterval(
        () => this.socket?.send('ping'),
        1000 * 30
      )
    }

    // khi kết nối bị đóng
    this.socket.onclose = () => {
      // loại bỏ vòng lặp tự động ping socket cũ
      if (this.ping_interval_id) clearInterval(this.ping_interval_id)

      // nếu đóng kết hoàn toàn thì không cho kết nối tự mở lại nữa
      if (this.is_force_close_socket) return

      // khởi tạo lại kết nối sau 100ms
      setTimeout(
        () => this.connect(url, selected_page_id_list, fb_staff_id, cb),
        5000
      )
    }

    // nếu có lỗi xảy ra
    this.socket.onerror = () => {
      this.socket?.close()
      // // loại bỏ vòng lặp tự động ping socket cũ
      // if (this.ping_interval_id) clearInterval(this.ping_interval_id)

      // // nếu đóng kết hoàn toàn thì không cho kết nối tự mở lại nữa
      // if (this.is_force_close_socket) return

      // // khởi tạo lại kết nối sau 100ms
      // setTimeout(
      //   () => this.connect(url, selected_page_id_list, fb_staff_id, cb),
      //   100
      // )
    }

    // khi có thông điệp từ socket gửi xuống
    this.socket.onmessage = ({ data }) => {
      if (!data || data === 'pong') return

      /**dữ liệu socket nhận được */
      let socket_data: {
        /**dữ liệu của khách hàng */
        conversation?: ConversationInfo
        /**dữ liệu tin nhắn mới */
        message?: MessageInfo
        /**dữ liệu nhân viên */
        staff?: StaffSocket
        /**tên sự kiện */
        event?: SocketEvent
        /**dữ liệu tin nhắn cần cập nhật */
        update_message?: MessageInfo
        /**dữ liệu comment cập nhật */
        update_comment?: FacebookCommentPost
      } = {}

      // cố gắng giải mã dữ liệu
      try {
        socket_data = JSON.parse(data)
      } catch (e) {}

      if (!size(socket_data)) return

      cb(socket_data)
    }
  }

  /** đóng socket */
  close() {
    // gắn cờ ngăn chặn kết nối mở lại
    this.is_force_close_socket = true
    this.socket?.close()
  }
}
