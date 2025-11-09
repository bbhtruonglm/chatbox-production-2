import JSZip from 'jszip'
import _ from 'lodash'
import { db } from './ChatDB'

export async function loadMockZipIncremental(url: string) {
  // 1. fetch file zip
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  const blob = await res.blob()

  // 2. giải nén zip
  const zip = await JSZip.loadAsync(blob)

  // 3. tìm file JSON đầu tiên
  const fileName = _.find(Object.keys(zip.files), f => f.endsWith('.json'))
  if (!fileName) throw new Error('No JSON file found in zip')

  const file = zip.file(fileName)!
  const text = await file.async('string')
  const json = JSON.parse(text)

  // 4. chuẩn hóa dữ liệu conversation
  const conversations = json.data.conversation as Record<string, any>

  // 5. lấy last_update hiện tại
  const lastUpdateEntry = await db.meta.get('last_update')

  const lastUpdate = lastUpdateEntry?.value ?? 0

  console.log(lastUpdate, 'last update')

  // 6. lọc những bản ghi mới hoặc đã thay đổi so với last_update
  const newConvs = _.pickBy(conversations, (c: any) => {
    const updated = c.last_message_time || Date.now()
    return updated > lastUpdate
  })

  console.log(newConvs, 'new conversation')
  // 7. chuẩn hóa + key lại bằng id
  const list = _.map(newConvs, (c, id) => ({ id, ...c }))
  const keyed = _.keyBy(list, 'id')

  // 8. lưu toàn bộ vào IndexedDB
  await db.saveMany(keyed)

  // 9. cập nhật last_update
  await db.meta.put({ key: 'last_update', value: Date.now() })

  // 10. trả về list (nếu muốn hiển thị UI)
  return list
}
