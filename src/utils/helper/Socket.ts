import type { SocketEvent } from '@/service/interface/app/common'
import type { ConversationInfo } from '@/service/interface/app/conversation'
import type { MessageInfo } from '@/service/interface/app/message'
import type { FacebookCommentPost } from '@/service/interface/app/post'
import type { StaffSocket } from '@/service/interface/app/staff'
import { keys, size } from 'lodash'
import { LocalStorage, type ILocalStorage } from '@/utils/helper/LocalStorage'
import { container, singleton } from 'tsyringe'

// chỉ có 1 thực thể duy nhất
@singleton()
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
      LocalStorage,
    ),
  ) {}

  /** Kết nối socket */
  connect(
    url: string,
    selected_page_id_list: string[],
    fb_staff_id: string,
    cb: Function,
  ) {
    console.log('-----------------socket connect')
    // kiểm tra socket còn sống không
    // if (this.socket?.readyState === WebSocket.OPEN) return

    /** access token của người dùng */
    const TOKEN = this.SERVICE_LOCAL_STORAGE.getItem('access_token')

    // nếu không có token thì dừng lại
    if (!TOKEN) return

    // đóng socket trước khi tạo mới một cái khác
    // this.socket?.close()
    // khởi tạo kết nối socket
    this.socket = new WebSocket(
      `${url}?access_token=${encodeURIComponent(TOKEN)}`,
    )

    // khi kết nối thành công
    this.socket.onopen = () => {
      // gửi danh sách page lên socket
      this.socket?.send(
        JSON.stringify({
          list_page: selected_page_id_list,
          fb_staff_id: fb_staff_id,
        }),
      )

      // tự động ping socket liên tục - 30s
      this.ping_interval_id = setInterval(
        () => this.socket?.send('ping'),
        1000 * 30,
      )
    }

    // khi kết nối bị đóng
    this.socket.onclose = e => {
      console.log('-----------------socket close', e)
      // loại bỏ vòng lặp tự động ping socket cũ
      if (this.ping_interval_id) clearInterval(this.ping_interval_id)

      // nếu đóng kết hoàn toàn thì không cho kết nối tự mở lại nữa
      // if (this.is_force_close_socket) return

      // khởi tạo lại kết nối sau 100ms
      setTimeout(
        () => this.connect(url, selected_page_id_list, fb_staff_id, cb),
        1000,
      )
    }

    // nếu có lỗi xảy ra
    this.socket.onerror = e => {
      console.log('-----------------socket error', e)
      this.socket?.close()
      // loại bỏ vòng lặp tự động ping socket cũ
      // if (this.ping_interval_id) clearInterval(this.ping_interval_id)

      // // nếu đóng kết hoàn toàn thì không cho kết nối tự mở lại nữa
      // if (this.is_force_close_socket) return

      // khởi tạo lại kết nối sau 100ms
      // setTimeout(
      //   () => this.connect(url, selected_page_id_list, fb_staff_id, cb),
      //   1000
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
    // this.is_force_close_socket = true

    /** instance socket hiện tại */
    const SOCKET = this.socket

    // đóng socket
    SOCKET?.close(1000, 'imedialy')

    console.log('-----------------------close socket')
  }
}

/**kết nối socket để nhận dữ liệu real-time */
@singleton()
export class RealtimeSocket {
  /**kết nối socket đến server */
  private socket?: WebSocket

  constructor(
    private SERVICE_LOCAL_STORAGE: ILocalStorage = container.resolve(
      LocalStorage,
    ),
  ) {}

  /** kiểm tra socket còn sống không */
  private isSocketAlive(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
  /** gửi ping qua socket */
  private sendPing(): void {
    this.socket?.send('ping')
  }
  /**đóng kết nối socket, trigger vào sự kiện onclose, cho phép retry */
  private closeSocket(): void {
    this.socket?.close()
  }
  /** retry kết nối socket với thời gian chờ tăng dần */
  private retryExponentialBackoff(
    url: string,
    selected_page_id_list: string[],
    fb_staff_id: string,
    proceed: Function,
  ): void {
    setTimeout(
      () => this.connect(url, selected_page_id_list, fb_staff_id, proceed),
      1000,
    )
  }

  /** gửi dữ liệu json qua socket */
  public sendJson(data: Object) {
    this.socket?.send(JSON.stringify(data))
  }
  /**đóng socket hoàn toàn, không retry */
  public closeImedialy() {
    console.log('Đóng hoàn toàn kết nối socket', new Date())

    // đóng socket với mã đóng riêng
    this.socket?.close(1000, 'IMEDIALY')
  }
  /** Kết nối socket */
  public connect(
    url: string,
    selected_page_id_list: string[],
    fb_staff_id: string,
    proceed: Function,
  ) {
    console.log('bước 1: bắt đầu kết nối socket', new Date())

    /**id vòng lặp ping socket, tránh socket bị chết sau 1 phút */
    let ping_interval_id: number | undefined
    /**mã truy cập của người dùng */
    const ACCESS_TOKEN = encodeURIComponent(
      this.SERVICE_LOCAL_STORAGE.getItem('access_token'),
    )

    // nếu socket còn sống thì đóng hẳn socket trước khi ghi đè thực thể
    if (this.isSocketAlive()) this.closeImedialy()

    // khởi tạo kết nối socket mới
    this.socket = new WebSocket(`${url}?access_token=${ACCESS_TOKEN}`)

    // nếu có lỗi xảy ra khi kết nối socket hoặc trong lúc đang kết nối
    // đóng socket, trigger vào sự kiện onclose, cho phép retry
    this.socket.onerror = e => {
      console.log('có lỗi phát sinh khi kết nối socket', e, new Date())

      // đóng socket, trigger vào sự kiện onclose, cho phép retry
      this.closeSocket()
    }

    // khi kết nối thành công, gửi danh sách trang để bắt đầu nhận event
    // tự động ping socket liên tục - 30s để tránh chết socket
    this.socket.onopen = () => {
      // gửi danh sách page lên socket
      this.sendJson({
        list_page: selected_page_id_list,
        fb_staff_id: fb_staff_id,
      })

      // tự động ping socket liên tục - 30s để tránh chết socket
      ping_interval_id = setInterval(() => this.sendPing(), 30_000)
    }

    // khi có thông điệp từ socket gửi xuống, call back ra ngoài
    this.socket.onmessage = ({ data }) => {
      // không call back nếu không có dữ liệu hoặc là sự kiện ping
      if (!data || data === 'pong') return

      // call back dữ liệu socket
      try {
        proceed(JSON.parse(data))
      } catch (e) {
        console.log('lỗi khi giải mã dữ liệu socket', e, new Date())
      }
    }

    // khi kết nối bị đóng (lỗi, mất mạng, trình duyệt tắt js, ...)
    this.socket.onclose = event => {
      console.log('kết nối socket bị đóng', event, new Date())

      // đóng hẳn socket này cho chắc?
      this.closeSocket()

      // loại bỏ vòng lặp tự động ping socket cũ, tránh leak ram
      clearInterval(ping_interval_id)

      // nếu yêu cầu đóng hẳn socket thì không retry nữa
      if (event.reason === 'IMEDIALY') return

      // retry kết nối socket với thời gian chờ tăng dần do các lỗi bất thường
      this.retryExponentialBackoff(
        url,
        selected_page_id_list,
        fb_staff_id,
        proceed,
      )
    }
  }
}

