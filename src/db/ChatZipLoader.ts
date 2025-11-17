import { find, keyBy, max, size, values } from 'lodash'
import { strFromU8, unzipSync } from 'fflate'

import { db } from './ChatDB'

/**
 * Tải file ZIP, giải nén, đọc dữ liệu .jsonb, parse từng dòng thành object,
 * sau đó đồng bộ vào IndexedDB theo logic "bản ghi mới nhất được ưu tiên".
 *
 * @param url URL file zip chứa dữ liệu backup
 * @returns danh sách conversation parse được từ ZIP
 */
export async function loadZip(url: string) {
  try {
    /** Gọi API lấy file ZIP */
    const RES = await fetch(url)
    /** Nếu lỗi HTTP thì throw */
    if (!RES.ok) throw new Error(`Failed to fetch ${url}`)

    /** Đọc file ZIP thành array buffer */
    const ARRAY_BUFFER = await RES.arrayBuffer()
    /** Chuyển về Uint8Array để truyền vào fflate */
    const UINT_8_ARRAY = new Uint8Array(ARRAY_BUFFER)

    /** Giải nén toàn bộ file trong ZIP */
    const FILES = unzipSync(UINT_8_ARRAY)

    /** Tìm file có đuôi .jsonb */
    const FILE_NAME = find(Object.keys(FILES), f => f.endsWith('.jsonb'))
    if (!FILE_NAME) throw new Error('No .jsonb file found in zip')

    /** Giải mã nội dung file .jsonb → UTF-8 text */
    const TEXT = strFromU8(FILES[FILE_NAME])

    /** Tách file theo dòng (mỗi dòng là 1 JSON) và remove dòng rỗng */
    const LINES = TEXT.split('\n').filter(Boolean)

    /** Parse từng dòng JSON thành object */
    const LIST = LINES.map(line => JSON.parse(line))

    /** Lưu các bản ghi cần cập nhật vào object thay vì array để dễ bulk save */
    const UPDATED_RECORDS: Record<string, any> = {}

    /* ==========================================================
       LẤY CÁC ID CẦN KIỂM TRA – FORMAT: pageId_clientId
    ========================================================== */
    const IDS = LIST
      /**
       * Chỉ lấy những bản ghi có đủ fb_page_id + fb_client_id
       * vì đó là định danh duy nhất để ghép conversation.
       */
      .filter(c => c.fb_page_id && c.fb_client_id)
      /** Tạo ra ID duy nhất dạng "page_client" */
      .map(c => `${c.fb_page_id}_${c.fb_client_id}`)

    /** Bulk-get từ IndexedDB để so sánh */
    const EXISTING_LIST = await db.conversations.bulkGet(IDS)

    /** Chuyển thành map để tra cứu nhanh hơn */
    const EXISTING_MAP = keyBy(EXISTING_LIST, 'id')

    /* ==========================================================
       DUYỆT TỪNG CONVERSATION MỚI SO SÁNH VỚI INDEXEDDB
    ========================================================== */
    for (const conv of LIST) {
      /** Bỏ qua nếu thiếu thông tin định danh */
      if (!conv.fb_page_id || !conv.fb_client_id) continue

      /** Tạo ID chuẩn */
      const ID = `${conv.fb_page_id}_${conv.fb_client_id}`
      /** Lấy bản ghi hiện có trong IndexedDB */
      const EXISTING = EXISTING_MAP[ID]

      /** Thời gian mới: ưu tiên last_message_time, fallback createdAt */
      const CONV_TIME = conv.last_message_time || conv.createdAt || 0
      /** Thời gian cũ */
      const EXISTING_TIME =
        EXISTING?.last_message_time || EXISTING?.createdAt || 0

      /** Nếu chưa tồn tại hoặc dữ liệu mới hơn thì đưa vào UPDATED_RECORDS */
      if (!EXISTING || CONV_TIME > EXISTING_TIME) {
        UPDATED_RECORDS[ID] = { ...conv, id: ID }
      }
    }

    /* ==========================================================
       LƯU VÀO INDEXEDDB (BULK SAVE)
    ========================================================== */
    if (size(UPDATED_RECORDS)) {
      /** Bulk save tất cả bản ghi cập nhật */
      await db.saveMany(UPDATED_RECORDS)

      /**
       * Tính ra thời điểm mới nhất để lưu vào meta.last_update
       * Giúp lần sau biết ZIP nào mới hơn.
       */
      const MAX_TIME =
        max(
          values(UPDATED_RECORDS).map(
            c => c.last_message_time || c.createdAt || 0
          )
        ) || Date.now()

      /** Cập nhật metadata trong IndexedDB */
      await db.meta.put({ key: 'last_update', value: MAX_TIME })

      console.log(`✅ Updated ${size(UPDATED_RECORDS)} records in IndexedDB`)
    } else {
      /** Không có dữ liệu mới để cập nhật */
      console.log('✅ No new updates, IndexedDB is up to date')
    }

    /** Trả về danh sách conversation dạng array */
    return LIST
  } catch (e) {
    /** Bắt mọi lỗi và log ra */
    console.error('Failed to load zip:', e)
    return []
  }
}
