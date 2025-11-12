import JSZip from 'jszip'
import _ from 'lodash'
import { db } from './ChatDB'

/**
 * Load zip từ URL (hoặc Blob trực tiếp), giải nén file .jsonb
 * @param input URL string hoặc Blob
 */
export async function loadZipJsonb(input: string | Blob) {
  try {
    let blob: Blob

    if (typeof input === 'string') {
      // fetch từ URL
      const res = await fetch(input)
      if (!res.ok) throw new Error(`Failed to fetch ${input}`)
      blob = await res.blob()
    } else {
      // đã là Blob
      blob = input
    }

    // Giải nén zip
    const zip = await JSZip.loadAsync(blob)

    // Tìm file .jsonb đầu tiên
    const fileName = _.find(Object.keys(zip.files), f => f.endsWith('.jsonb'))
    if (!fileName) throw new Error('No .jsonb file found in zip')

    const file = zip.file(fileName)!
    const text = await file.async('string')

    // Mỗi object trên 1 line
    const lines = text.split('\n').filter(Boolean)

    // Parse JSON
    const list = lines.map(line => JSON.parse(line))

    // KeyBy `_id` để bulkPut vào Dexie
    const keyed = _.keyBy(list, '_id')
    await db.saveMany(keyed)

    console.log(`✅ Loaded ${list.length} records to IndexedDB`)
    return list
  } catch (e) {
    console.error('Failed to load zip jsonb:', e)
    return []
  }
}
