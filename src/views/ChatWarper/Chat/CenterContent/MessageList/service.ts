import { useI18n } from 'vue-i18n'

import type {
  AttachmentInfo,
  ChatbotButton,
  MessageAiData,
  MessageInfo,
  MessageTemplateInput,
} from '@/service/interface/app/message'
import { singleton } from 'tsyringe'

export function composableService() {
  const { t: $t } = useI18n()

  /**dịch vụ tin nhắn */
  @singleton()
  class MessageService {
    /**xử lý dữ liệu nút bấm */
    private formatButton(list_raw_button: ChatbotButton[]) {
      return list_raw_button?.map(button => ({
        title: button.title,
        url: button?.url,
        type: button?.type,
      }))
    }

    /**
     * tạo ra dữ liệu tin nhắn nâng cao từ dữ liệu đính kèm
     * @param ai dữ liệu AI
     * @param attachments dữ liệu đính kèm
     * @param text văn bản
     * @param postback_title tiêu đề postback
     * */
    genMessageSource(
      ai?: MessageAiData[],
      attachments?: AttachmentInfo[],
      text?: string,
      postback_title?: string
    ): MessageTemplateInput[] {
      /**
       * - chỉ lấy dữ liệu của attr đầu tiên
       * - nếu có nhiều attr thì xử lý kiểu khác (hiện tại chỉ có FB là có list attr là dạng ảnh)
       */
      const SOURCE = attachments?.[0]

      /**kết quả trả về */
      let result: MessageTemplateInput[] = []

      // nếu không attr -> văn bản thuần tuý | nếu không có thì báo lỗi
      if (!SOURCE?.payload)
        result.push({
          is_ai: false,
          content: text || postback_title || '',
          // || $t('v1.common.unsupport_message'),
        })

      // nếu chỉ có các nút bấm -> chỉ tạo 1 record
      if (SOURCE?.payload?.buttons)
        result.push({
          is_ai: false,
          // nút bấm sẽ kèm theo một nội dung tin nhắn nào đó
          content: text,
          // map lại dữ liệu nút bấm
          list_button: this.formatButton(SOURCE.payload.buttons),
        })

      // nếu là dạng element (slider, file đã xử lý AI) -> tạo 1 mảng dữ liệu
      if (
        SOURCE?.payload?.elements &&
        SOURCE?.payload?.template_type !== 'button'
      )
        result.push(
          ...SOURCE?.payload?.elements?.map((element, index) => {
            /**dữ liệu của 1 template */
            let res: MessageTemplateInput = {}

            // tạm thời chỉ hiện AI với image
            if (ai?.[0]?.ocr) res.is_ai = true
            else res.is_ai = false

            // thêm dữ liệu AI nếu có
            if (ai?.[index]) res.ai = ai?.[index]

            // tiêu đề
            res.title = element.title
            // nội dung văn bản, hoặc url file fb không hiển thị được
            res.content = element.subtitle || text || element.url
            // dữ liệu ocr của AI
            res.ocr = ai?.[0]?.ocr
            // danh sách nút bấm
            if (element?.buttons)
              res.list_button = this.formatButton(element?.buttons)

            // hình ảnh của slider
            if (element.image_url) res.image = { url: element.image_url }

            // video của AI
            if (element.video_url) res.video = { url: element.video_url }
            // âm thanh của AI
            if (element.audio_url) res.audio = { url: element.audio_url }
            // file của AI
            if (element.file_url) res.file = { url: element.file_url }

            // trả về dữ liệu
            return res
          })
        )

      // nếu chỉ có url (là file nhưng chưa xử lý AI, link dạng fallback) -> tạo 1 record
      if (SOURCE?.payload?.url && !SOURCE?.payload?.elements) {
        /**dữ liệu của 1 template */
        let res: MessageTemplateInput = {}

        // tính là chưa xử lý AI
        res.is_ai = false

        // hình ảnh
        if (SOURCE?.type === 'image') res.image = { url: SOURCE.payload.url }
        // video
        if (SOURCE?.type === 'video') res.video = { url: SOURCE.payload.url }
        // âm thanh
        if (SOURCE?.type === 'audio') res.audio = { url: SOURCE.payload.url }
        // tập tin khác
        if (SOURCE?.type === 'file') res.file = { url: SOURCE.payload.url }
        // link
        if (SOURCE?.type === 'fallback') {
          res.title = text
          res.content = SOURCE.payload.title
          res.list_button = [
            {
              title: $t('v1.view.main.dashboard.chat.action.open_url'),
              url: SOURCE.payload.url,
              type: 'web_url',
            },
          ]
        }

        // trường hợp vừa có ảnh vừa có text
        if (text) res.content = text

        // trả về dữ liệu
        result.push(res)
      }

      // trả về mảng
      return result
    }
  }

  return { MessageService }
}
