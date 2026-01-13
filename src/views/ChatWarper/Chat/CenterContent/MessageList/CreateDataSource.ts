import type {
  MessageInfo,
  MessageTemplateInput,
} from '@/service/interface/app/message'
import { Cdn, type ICdn } from '@/utils/helper/Cdn'
import { container, singleton } from 'tsyringe'

/**chuyển đổi dữ liệu att bình thường thành dạng data source mới */
export interface ICreateDataSource {
  exec(
    message?: MessageInfo,
    index?: number,
    platform_type?: string
  ): MessageTemplateInput
}

/**chuyển đổi dữ liệu att bình thường thành dạng data source mới */
@singleton()
export class CreateDataSource implements ICreateDataSource {
  /**
   * @param SERVICE_CDN dịch vụ cdn
   */
  constructor(private readonly SERVICE_CDN: ICdn = container.resolve(Cdn)) {}

  exec(message?: MessageInfo, index?: number, platform_type?: string) {
    // nếu không có index thì trả về object rỗng
    if (index === undefined) return {}

    /** nền tảng của tin nhắn */
    const PLATFORM_TYPE = platform_type || message?.platform_type

    /** lấy id của tin nhắn */
    const TARGET_ID = message?.message_mid

    /** xác định platform để lấy url tương ứng */
    let url = ''

    switch (PLATFORM_TYPE) {
      case 'WEBSITE':
        url = this.SERVICE_CDN.webMessageMedia(
          message?.fb_page_id,
          TARGET_ID,
          index
        )
        break
      case 'FB_INSTAGRAM':
        url = this.SERVICE_CDN.igMessageMedia(
          message?.fb_page_id,
          TARGET_ID,
          index
        )
        break
      case 'TIKTOK':
        url = this.SERVICE_CDN.tiktokMessageMedia(
          message?.fb_page_id,
          TARGET_ID,
          index
        )
        break
      case 'ZALO_OA':
      case 'ZALO_PERSONAL':
        url = this.SERVICE_CDN.zaloMessageMedia(
          message?.fb_page_id,
          TARGET_ID,
          index
        )
        break
      default:
        url = this.SERVICE_CDN.fbMessageMedia(
          message?.fb_page_id,
          TARGET_ID,
          index
        )
        break
    }

    // trả về dữ liệu mới
    return {
      image: {
        url,
      },
      ocr: message?.ai?.[index]?.ocr,
      list_button:
        message?.message_attachments?.[index]?.payload?.elements?.[0]?.buttons,
    }
  }
}
