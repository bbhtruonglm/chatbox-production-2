import type { IPost, IPostAnalytic } from '@/service/interface/app/message'
import type { FacebookCommentPost } from '@/service/interface/app/post'
import { N4Serivce } from '@/utils/api/N4Serivce'
import { singleton } from 'tsyringe'

/**dữ liệu của bình luận sau khi tạo */
interface ISendCommentRes {
  /**id của bình luận được tạo */
  id?: string
}

/**gọi API module page của chatbox */
@singleton()
export class N4SerivceAppPost extends N4Serivce {
  constructor() {
    // gọi API module page của chatbot
    super('app/post')
  }

  /** Lấy bình luận chính của bài post với khách hàng */
  public async getMainComment(
    page_id: string,
    client_id: string,
    post_id: string,
    skip?: number,
    limit?: number
  ): Promise<FacebookCommentPost[]> {
    return this.post('get_comment', {
      page_id,
      client_id,
      target_id: post_id,
      limit,
      skip,
    })
  }
  /** Lấy bình luận chính của bài post với tòa bộ khách hàng */
  public async getPostComment(
    page_id: string,
    post_id: string,
    skip?: number,
    limit?: number
  ): Promise<FacebookCommentPost[]> {
    return this.post('get_comment', {
      page_id,
      target_id: post_id,
      limit,
      skip,
    })
  }
  /** Lấy bình luận con */
  public async getChildComment(
    page_id: string,
    // client_id: string,
    comment_id: string,
    skip?: number,
    limit?: number
  ): Promise<FacebookCommentPost[]> {
    return this.post('get_comment', {
      page_id,
      // client_id,
      target_id: comment_id,
      limit,
      skip,
    })
  }
  /**trả lời bình luận */
  public async sendComment(
    page_id: string,
    target_id: string,
    text: string
  ): Promise<ISendCommentRes> {
    return this.post('send_comment', { page_id, target_id, text })
  }
  /**trả lời tin nhắn bí mật */
  public async sendPrivateReply(
    page_id: string,
    client_id: string,
    post_id: string,
    target_id: string,
    text: string
  ): Promise<ISendCommentRes> {
    return this.post('private_reply', {
      page_id,
      client_id,
      post_id,
      target_id,
      text,
    })
  }
  /**ẩn hiện bình luận */
  public async toggleComment(
    page_id: string,
    client_id: string,
    post_id: string,
    target_id: string,
    is_hidden: boolean
  ): Promise<ISendCommentRes> {
    return this.post('toggle_comment', {
      page_id,
      client_id,
      post_id,
      target_id,
      is_hidden,
    })
  }
  /**đọc info 1 bài post */
  public async deleteComment(
    page_id: string,
    client_id: string,
    post_id: string,
    target_id: string
  ): Promise<ISendCommentRes> {
    // Xóa comment theo đúng payload backend yêu cầu.
    return this.post('delete_comment', {
      page_id,
      client_id,
      post_id,
      target_id,
    })
  }
  public async getPost(
    page_id: string,
    post_id?: string,
    ad_id?: string
  ): Promise<IPost> {
    return this.post('get_post', {
      page_id,
      post_id,
      ad_id,
    })
  }
  /**đọc thống kê 1 bài post */
  public async getPostAnalytic(
    page_id: string,
    post_id?: string,
    ad_id?: string,
    is_refresh_cache?: boolean
  ): Promise<IPostAnalytic> {
    return this.post('get_post_analytic', {
      page_id,
      post_id,
      ad_id,
      is_refresh_cache,
    })
  }
  /**đọc danh sách bài post */
  public async getPosts(
    page_id: string | Object,
    skip: number,
    limit: number,
    search?: string
  ): Promise<IPost[]> {
    return this.post('get_posts', {
      page_id,
      skip,
      limit,
      search
    })
  }
}
