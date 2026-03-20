import type { ChatbotUserInfo } from '@/service/interface/app/chatbot_user'
import { N4Serivce } from '@/utils/api/N4Serivce'

/**gọi API module page của chatbox */
export class N4SerivceAppUser extends N4Serivce {
  constructor() {
    // gọi API module page của chatbot
    super('app/chatbot_user')
  }

  /**tìm kiếm dữ liệu người dùng */
  public async findUser(user_id: string): Promise<ChatbotUserInfo> {
    // gọi api
    return this.post('read_another_chatbot_user', { user_id })
  }

  /** tải ảnh nhân sự lên */
  public async uploadUserAvatar(file: File): Promise<string> {
    /** dữ liệu form data */
    const FORM_DATA = new FormData()
    // thêm file vào form data
    FORM_DATA.append('file', file)
    // gọi api
    return this.upload('upload_user_avatar', {}, FORM_DATA)
  }

  /** lưu dữ liệu nhân sự */
  public async updateUserInfo(data:{avatar: string}): Promise<void> {
    return this.post('update_chatbot_user_info', data)
  }
}
