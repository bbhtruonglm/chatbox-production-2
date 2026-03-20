import { useMessageStore } from '@/stores'

import type { FileTypeInfo } from '@/service/interface/app/message'
import type { Cb } from '@/service/interface/function'
import { normalizeFileName } from '@/utils/helper/Validate'

/**các kiểu tệp fb cho phép khi upload */
export const FB_VALID_FILE_TYPE = ['audio', 'file', 'image', 'video']

/**giới hạn kích thước tối đa cho file upload (20MB) */
export const MAX_FILE_SIZE = 20 * 1024 * 1024

/**
 * Kiểm tra kích thước file có vượt quá giới hạn cho phép không
 * @param {File} file - file cần kiểm tra
 * @param {number} max_size - kích thước tối đa (byte), mặc định 20MB
 * @returns {boolean} true nếu file hợp lệ (không vượt quá giới hạn)
 */
export const validateFileSize = (file: File, max_size: number = MAX_FILE_SIZE): boolean => {
  // nếu file vượt quá giới hạn cho phép
  if (file.size > max_size) return false

  // file hợp lệ
  return true
}

/**phân tích file type của FB từ minetype */
export const getFbFileType = (mine_type: string): FileTypeInfo => {
    /**kiểu của file phân tích được */
    let type = mine_type?.split('/')?.[0]

    /**kết quả */
    let result: FileTypeInfo

    // nếu không tìm thấy kiểu phù hợp thì fix kiểu mặc định
    if (!FB_VALID_FILE_TYPE.includes(type)) result = 'file'
    else result = type as FileTypeInfo

    return result
}

/**chuyển đổi img src thành file upload được */
export const srcImageToFile = (src: string, proceed: Cb<File>) => fetch(src)
    .then(r => r.blob())
    .then(blob => proceed(
        null,
        new File([blob], 'image.jpg', { type: blob.type }))
    )
    .catch(proceed)

/**xử lý dữ liệu trên máy tính */
export const handleFileLocal = (file: File) => {
    const messageStore = useMessageStore()

    /**kiểu fb của file */
    const TYPE = getFbFileType(file.type)

    /** Id random cho ảnh để thêm vào id img khi render */
    const ID = crypto.randomUUID()

    /** 🔹 Chuẩn hóa tên file để tránh lỗi ký tự đặc biệt */
    const CLEAN_NAME = normalizeFileName(file.name)

    /** file đã chuẩn hóa tên */
    const CLEANED_NAME_FILE = new File([file], CLEAN_NAME, { type: file.type })

    // nếu không phải là ảnh
    if (TYPE !== 'image') {
      return messageStore.upload_file_list.push({ 
        id: ID, 
        source: CLEANED_NAME_FILE, 
        type: TYPE,
        file_name: CLEANED_NAME_FILE.name
      })
    }

    // render hình ảnh để hiển thị preview
    const READER = new FileReader()

    READER.onload = $event => messageStore.upload_file_list.push({
        id: ID,
        source: CLEANED_NAME_FILE,
        file_name: CLEANED_NAME_FILE.name,
        type: TYPE,
        preview: $event.target?.result
    })
    READER.readAsDataURL(CLEANED_NAME_FILE)
}

/** hàm lấy phần mở rộng của file */
export const getFileExtension = (file_name: string) => file_name.split('.').pop()?.toLowerCase() || ''

/** hàm phân loại các file */
export const getFileType = (ext: string) => {
  /** các mở rộng của word */
  const WORD_EXT = [
    'doc',
    'docx',
    'dot',
    'dotx'
  ]
  /** các mở rộng của excel */
  const EXCEL_EXT = [
    'xls',
    'xlsx',
    'xlsm'
  ]
  /** các mở rộng của powerpoint */
  const POWERPOINT_EXT = [
    'ppt',
    'pptx',
    'pps',
    'ppsx'
  ]

  // nếu là file word
  if (WORD_EXT.includes(ext)) return 'WORD'
  // nếu là file excel
  if (EXCEL_EXT.includes(ext)) return 'EXCEL'
  // nếu là file powerpoint
  if (POWERPOINT_EXT.includes(ext)) return 'PPT'
  // nếu là file pdf
  if (ext === 'pdf') return 'PDF'

  return 'UNKNOWN'
}