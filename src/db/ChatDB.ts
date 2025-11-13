import Dexie from 'dexie'
import _ from 'lodash'

export interface Conversation {
  id?: string // composite key: fb_page_id__fb_client_id
  fb_client_id: string
  fb_page_id: string
  conversation_type?: 'CHAT' | 'POST'
  unread_message_amount?: number
  last_message_type?: string
  client_name?: string
  client_alias_name?: string
  client_phone?: string
  client_email?: string
  label_id?: string[]
  is_spam_fb?: boolean
  last_message_time?: number
  is_have_fb_inbox?: boolean
  is_have_fb_post?: boolean
  is_group?: boolean
  fb_staff_id?: string
  user_id?: string
  platform_type?: string
  list_fb_post_id?: string[]
  last_update?: number
  [key: string]: any
}

interface Meta {
  key: string
  value: any
}

class ChatDB extends Dexie {
  conversations!: Dexie.Table<Conversation, string>
  meta!: Dexie.Table<Meta, string>

  constructor() {
    super('chat_demo')
    this.version(1).stores({
      conversations:
        'id, fb_client_id, fb_page_id, conversation_type, unread_message_amount, last_message_type, client_name, client_alias_name, client_phone, client_email, is_spam_fb, last_message_time, fb_staff_id, user_id, platform_type',
      meta: 'key',
    })
  }

  /** Save nhiều conversation và update last_update */
  async saveMany(mapConvs: Record<string, Conversation>) {
    const list = _.map(mapConvs, c => {
      const id = `${c.fb_page_id}__${c.fb_client_id}`
      return { ...c, id, last_update: Date.now() }
    })
    if (!list.length) return
    await this.conversations.bulkPut(list)

    // Lưu giá trị last_update lớn nhất vào meta
    const maxUpdate = Math.max(...list.map(c => c.last_update || 0))
    await this.meta.put({ key: 'last_update', value: maxUpdate })
  }

  /** Lấy last_update để incremental fetch */
  async getLastUpdate(): Promise<number> {
    const meta = await this.meta.get('last_update')
    return meta?.value || 0
  }

  /** Cập nhật conversation từ tin nhắn mới */
  async updateFromMessage(detail: any) {
    const id = `${detail.fb_page_id}__${detail.fb_client_id}`
    const conv = await this.conversations.get(id)
    const lastMessageTime = detail.last_message_time || Date.now()
    if (!conv) {
      // nếu chưa có conversation, tạo mới
      await this.conversations.put({
        id,
        fb_page_id: detail.fb_page_id,
        fb_client_id: detail.fb_client_id,
        last_message: detail.message_text,
        last_message_time: lastMessageTime,
        last_message_id: detail._id,
        last_message_type: detail.message_type,
        unread_message_amount: detail.message_type === 'client' ? 1 : 0,
        last_update: Date.now(),
      })
      return
    }
    if (lastMessageTime > (conv.last_message_time || 0)) {
      await this.conversations.update(id, {
        last_message_time: lastMessageTime,
        last_message: detail.message_text || conv.last_message,
        last_message_id: detail._id,
        last_message_type: detail.message_type,
        unread_message_amount:
          detail.message_type === 'client'
            ? (conv.unread_message_amount || 0) + 1
            : conv.unread_message_amount,
        last_update: Date.now(),
      })
    }
  }

  /** Filter conversation giống trước đây */
  async filter(
    filter: any,
    after?: string,
    limit: number = 50
  ): Promise<{ conversations: Conversation[]; after?: string }> {
    let collection = this.conversations.toCollection()

    // --- filter cơ bản ---
    if (filter.unread_message === 'true')
      collection = collection.filter(c => (c.unread_message_amount || 0) > 0)
    if (filter.not_response_client === 'true')
      collection = collection.filter(
        c => (c.last_message_type || '').toLowerCase() === 'client'
      )
    if (filter.not_exist_label === 'true')
      collection = collection.filter(c => !c.label_id?.length)
    if (filter.have_phone === 'YES')
      collection = collection.filter(c => !!c.client_phone)
    if (filter.have_phone === 'NO')
      collection = collection.filter(c => !c.client_phone)
    if (filter.is_spam_fb === 'YES')
      collection = collection.filter(c => c.is_spam_fb === true)
    if (filter.is_spam_fb === 'NO')
      collection = collection.filter(c => c.is_spam_fb !== true)
    if (filter.conversation_type)
      collection = collection.filter(
        c => c.conversation_type === filter.conversation_type
      )
    if (filter.have_client_name)
      collection = collection.filter(c => !!c.client_name)
    if (filter.display_style) {
      switch (filter.display_style) {
        case 'INBOX':
          collection = collection.filter((c: any) => c.is_have_fb_inbox)
          break
        case 'COMMENT':
          collection = collection.filter((c: any) => c.is_have_fb_post)
          break
        case 'GROUP':
          collection = collection.filter((c: any) => c.is_group)
          break
        case 'FRIEND':
          collection = collection.filter(c => !c.is_group)
          break
      }
    }
    if (filter.not_have_fb_uid)
      collection = collection.filter(c => !c.client_bio)
    if (filter.have_email === 'YES')
      collection = collection.filter(c => !!c.client_email)
    if (filter.have_email === 'NO')
      collection = collection.filter(c => !c.client_email)
    if (filter.platform_type)
      collection = collection.filter(
        c => c.platform_type === filter.platform_type
      )
    if (filter.post_id)
      collection = collection.filter((c: any) =>
        c.list_fb_post_id?.includes(filter.post_id)
      )
    if (filter.staff_id?.length)
      collection = collection.filter(
        c =>
          filter.staff_id.includes(c.fb_staff_id!) ||
          filter.staff_id.includes(c.user_id!)
      )
    if (filter.time_range?.gte || filter.time_range?.lte) {
      const { gte, lte } = filter.time_range
      collection = collection.filter(c => {
        const t = c.last_message_time || 0
        if (gte && t < gte) return false
        if (lte && t > lte) return false
        return true
      })
    }
    if (filter.label_id?.length) {
      if (filter.label_and)
        collection = collection.filter(c =>
          filter.label_id.every((id: any) => c.label_id?.includes(id))
        )
      else
        collection = collection.filter(c =>
          c.label_id?.some(id => filter?.label_id?.includes(id))
        )
    }
    if (filter.not_label_id?.length)
      collection = collection.filter(
        c => !c.label_id?.some(id => filter.not_label_id.includes(id))
      )
    if (filter.search) {
      const search = filter.search.toLowerCase()
      collection = collection.filter(c =>
        [
          c.client_name,
          c.client_alias_name,
          c.client_phone,
          c.client_email,
          c.last_message,
          c.fb_client_id,
        ]
          .filter(Boolean)
          .some(v => v!.toLowerCase().includes(search))
      )
    }

    // --- sort ---
    const sorted = await collection.sortBy('unread_message_amount')
    const final = _.orderBy(
      sorted,
      ['unread_message_amount', 'last_message_time'],
      ['desc', 'desc']
    )

    // --- handle after ---
    let startIndex = 0
    if (after) {
      const idx = final.findIndex(c => c.id === after)
      if (idx >= 0) startIndex = idx + 1
    }

    const slice = final.slice(startIndex, startIndex + limit)
    const nextAfter = slice.length ? slice[slice.length - 1].id : undefined

    return { conversations: slice, after: nextAfter }
  }
}

export const db = new ChatDB()
