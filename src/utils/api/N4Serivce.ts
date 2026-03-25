import { Botx } from '@/utils/api/Botx'

/**gọi API lên server n4 của chatbox */
// TODO: N4Serivce đang sai lỗi chính tả
export class N4Serivce extends Botx {
  constructor(path: string) {
    // gọi API lên server của chatbox
    super(`${$env.host.n4_service_v2}/${path}`)
  }
}
/**gọi API lên module của app */
class N4ServiceApp extends N4Serivce {
  /**id trang */
  readonly #PAGE_ID: string
  /**id khách hàng */
  readonly #CLIENT_ID: string

  constructor(page_id: string, client_id: string, path: string) {
    // gọi API lên module của app
    super(`app/${path}`)

    // lưu lại id trang
    this.#PAGE_ID = page_id
    // lưu lại id khách hàng
    this.#CLIENT_ID = client_id
  }

  /**gọi api post lên AI */
  protected post(path: string, body?: Record<string, any>): Promise<any> {
    return super.post(path, {
      page_id: this.#PAGE_ID,
      client_id: this.#CLIENT_ID,
      ...body,
    })
  }
}

/**dữ liệu của 1 liên hệ */
export interface ConversationInfo {
  /**dữ liệu chi tiết luôn có*/
  client_bio?: {
    fb_uid?: string
    fb_info: object
  }
}

/**gọi API module dữ liệu liên lạc của N4Service */
export class N4ServiceConversation extends N4ServiceApp {
  constructor(page_id: string, client_id: string) {
    // nạp dữ liệu page_id, client_i
    super(page_id, client_id, 'conversation')
  }

  /**đọc data liên lạc của khách hàng */
  async getConversation(body?: BaseQuery): Promise<ConversationInfo> {
    // gọi api lấy info data của user
    return this.post('get_conversation_client_bio', body)
  }
}