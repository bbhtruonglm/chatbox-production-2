import type { AttachmentInfo, MessageAiData } from './message'

/**dữ liệu của một bình luận */
export interface FacebookCommentPost {
  /**id bài viết */
  post_id?: string
  /**id bình luận cha, post */
  parent_id?: string
  /**id bản ghi gốc của dB */
  _id?: string
  /**đã trả lời bí mật rồi */
  is_private_reply?: boolean
  comment_id: string
  from?: {
    id?: string
    name?: string
  }
  message: string
  photo?: string
  /**gắn cờ đã load hết child comment */
  done_load_comment?: boolean
  /**phân trang */
  skip_comment?: number
  child_comments?: FacebookCommentPost[]

  // * Flag
  new_comment?: string
  sending_message?: boolean
  /**đánh dấu comment đã bị xoá để UI hiển thị mờ và chặn thao tác xoá lại */
  is_delete_comment?: boolean

  // * Time
  createdAt?: string

  /**dữ liệu của AI */
  ai?: MessageAiData[]
  /**nội dung tệp đính kèm */
  message_attachments?: AttachmentInfo[]
}

export interface FacebookPost {
  _id: string
  id: string
  content: {
    admin_creator: {
      name: string
      id: string
    }
    attachments: {
      data: [
        {
          media: {
            image: {
              height: number
              src: string
              width: number
            }
            source: string
          }
          target: {
            id: string
            url: string
          }
          type: string
          url: string
        }
      ]
    }
    message: string
    created_time: string
    permalink_url: string
    updated_time: string
    from: {
      name: string
      id: string
    }
    id: string
  }
  attachments: {
    data: [
      {
        media: {
          image: {
            height: number
            src: string
            width: number
          }
          source: string
        }
        target: {
          id: string
          url: string
        }
        type: string
        url: string
      }
    ]
  }
  createdAt: string
  created_time: string
  creator_name: string
  fb_page_id: string
  fb_post_id: string
  message: string
  permalink_url: string
  updatedAt: string
  updated_time: string
  is_selected?: boolean
}
