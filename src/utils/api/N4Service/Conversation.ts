import type {
  ConversationInfo,
  FilterConversation,
  QueryConversationInput,
  QueryConversationResponse,
} from '@/service/interface/app/conversation'
import { N4Serivce } from '@/utils/api/N4Serivce'
import { singleton } from 'tsyringe'

/**
 * gọi API module conversation của chatbox
 * @deprecated
 */
export class N4SerivceAppConversationBk extends N4Serivce {
  /**id trang */
  readonly #PAGE_ID: string

  constructor(page_id: string) {
    // gọi API module page của chatbot
    super('app/conversation')

    // lưu lại id trang
    this.#PAGE_ID = page_id
  }

  /**đính kèm id trang lên toàn bộ API */
  protected post(path: string, body?: Record<string, any>): Promise<any> {
    return super.post(path, { page_id: this.#PAGE_ID, ...body })
  }
}

/**
 * gọi API thao tác 1 hội thoại
 * @deprecated
 */
export class N4SerivceAppOneConversation extends N4SerivceAppConversationBk {
  /**id khách hàng */
  readonly #CLIENT_ID: string

  constructor(page_id: string, client_id: string) {
    // gọi API module page của chatbot
    super(page_id)

    // lưu lại id khách hàng
    this.#CLIENT_ID = client_id
  }

  /**đính kèm id client lên toàn bộ API */
  protected post(path: string, body?: Record<string, any>): Promise<any> {
    return super.post(path, { client_id: this.#CLIENT_ID, ...body })
  }

  /**sửa tên khách hàng */
  async updateClientName(client_name: string): Promise<void> {
    // gọi api
    return this.post('edit_client_name', { client_name })
  }
  /**
   * thay đổi số tin nhắn chưa đọc
   * @param amount số lượng tin nhắn chưa đọc mới
   */
  async resetRead(amount: number = 0): Promise<void> {
    // gọi api
    return this.post('reset_read_conversation', {
      unread_message_amount: amount,
    })
  }
  /**
   * tắt bật nhãn
   * @param label_id id nhãn
   */
  async toggleLabel(label_id: string): Promise<void> {
    // gọi api
    return this.post('toggle_label_conversation', { label_id })
  }
}

@singleton()
export class N4SerivceAppConversation extends N4Serivce {
  constructor() {
    super('app/conversation')
  }

  /**
   * lấy danh sách hội thoại
   * @param page_ids danh sách id trang
   * @param filter điều kiện lọc
   * @param limit số lượng hội thoại
   * @param after chỉ lấy hội thoại sau id này
   */
  async readConversations(
    page_ids: string[],
    org_id: string,
    filter: FilterConversation,
    limit?: number,
    sort?: string,
    after?: number[]
  ): Promise<QueryConversationResponse> {
    // gọi api
    return this.post('read_conversation', {
      page_id: page_ids,
      org_id,
      limit,
      after,
      sort,
      ...filter,
    })
  }
  /**
   * lấy dữ liệu 1 hội thoại
   * @param page_id id trang
   * @param client_id id khách hàng
   */
  async readConversation(
    page_id: string,
    client_id: string
  ): Promise<ConversationInfo | undefined> {
    /**dữ liệu hội thoại */
    const RES: QueryConversationResponse = await this.post(
      'read_conversation',
      {
        page_id: [page_id],
        client_id,
        limit: 1,
        conversation_type: 'POST',
      }
    )

    /**id hội thoai */
    const KEY = `${page_id}_${client_id}`

    // trả về hội thoại tìm thấy
    return RES?.conversation?.[KEY]
  }
  /**xóa câu trả lời ai của hội thoại */
  async clearAiAnswer(page_id: string, client_id: string): Promise<void> {
    return this.post('clear_ai_answer', { page_id, client_id })
  }

  /** 
   * lấy số lượng hội thoại 
   * @param page_ids danh sách id trang
   * @param filter điều kiện lọc
   * @returns
   * */
  async countConversation(
    page_ids: string[],
    filter: FilterConversation
  ): Promise<number> {
    return this.post('count_conversation', { 
      page_id: page_ids,
      ...filter
    })
  }

  /**tắt bật chatbot */
  async manageChatbot(
    page_id: string,
    client_id: string,
    is_disable: boolean,
    bot_resume_after?: number
  ): Promise<ConversationInfo> {
    return this.post('manage_chatbot', { page_id, client_id, is_disable, bot_resume_after })
  }
}
