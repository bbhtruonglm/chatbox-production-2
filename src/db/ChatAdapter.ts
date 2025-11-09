import type { Conversation } from './ChatDB'
import type { FilterConversation } from '@/service/interface/app/conversation'
import _ from 'lodash'
import { db } from './ChatDB'

export class ChatAdapter {
  static useLocal = true

  static async fetchConversations(
    pageIds: string[],
    orgId: string,
    filter: FilterConversation,
    limit = 50,
    sort?: string,
    after?: string
  ): Promise<{ conversation: Record<string, Conversation>; after?: string }> {
    if (ChatAdapter.useLocal) {
      const { conversations, after: nextCursor } = await db.filter(
        filter,
        after,
        limit
      )
      return { conversation: _.keyBy(conversations, 'id'), after: nextCursor }
    } else {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ pageIds, orgId, filter, limit, sort, after }),
      })
      const data = await res.json()
      await db.saveMany(data.conversation)
      return { conversation: data.conversation, after: data.after }
    }
  }

  static async saveZipData(data: Record<string, Conversation>) {
    return db.saveMany(data)
  }
}
