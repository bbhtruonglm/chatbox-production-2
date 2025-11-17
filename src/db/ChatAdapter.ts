import _, { keyBy, orderBy } from 'lodash'

import type { Conversation } from './ChatDB'
import type { FilterConversation } from '@/service/interface/app/conversation'
import { db } from './ChatDB'

export class ChatAdapter {
  /** Trạng thái dùng biến local */
  static useLocal = false

  static async fetchConversations(
    pageIds: string[],
    orgId: string,
    filter: FilterConversation,
    limit = 50,
    sort?: string,
    after?: number[] // ✅ sửa kiểu từ string -> number[]
  ): Promise<{ conversation: Record<string, Conversation>; after?: number[] }> {
    const { conversations: DB_CONVS } = await db.filter(
      filter,
      after, // number[] tương thích
      limit,
      pageIds
    )

    /** sort với last_message_time || create_at */
    let list = orderBy(
      DB_CONVS,
      [
        c => c.unread_message_amount || 0,
        c => c.last_message_time || c.create_at || 0,
      ],
      ['desc', 'desc']
    )

    /** handle pagination */
    let start_index = 0
    /** Nếu có giá trị after */
    if (after?.length) {
      /** Lấy list sau after */
      const IDX = list.findIndex(c => after.includes(c.last_message_time || 0))
      /** Nếu IDX > 0, tăng giá trị index */
      if (IDX >= 0) start_index = IDX + 1
    }
    /** Căt list từ index -> tới index + limit */
    const SLICE = list.slice(start_index, start_index + limit)
    /** Trả lại giá trị after để call lại lần sau - hoặc là undefined */
    const NEXT_AFTER = SLICE.length
      ? SLICE.map(c => c.last_message_time || 0) // ✅ number[] tương thích
      : undefined

    /** Trả về conversation và after */
    return { conversation: keyBy(SLICE, 'id'), after: NEXT_AFTER }
  }

  /** Lưu Hàm xử lý Lưu zip data */
  static async saveZipData(data: Record<string, Conversation>) {
    return db.saveMany(data)
  }
}
