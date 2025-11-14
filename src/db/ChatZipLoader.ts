import _, { size } from 'lodash'

import JSZip from 'jszip'
import { db } from './ChatDB'

export async function loadZip(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch ${url}`)
    const blob = await res.blob()

    const zip = await JSZip.loadAsync(blob)
    const fileName = _.find(Object.keys(zip.files), f => f.endsWith('.jsonb'))
    if (!fileName) throw new Error('No .jsonb file found in zip')
    const file = zip.file(fileName)!
    const text = await file.async('string')

    const lines = text.split('\n').filter(Boolean)
    const list = lines.map(line => JSON.parse(line))

    const updatedRecords: Record<string, any> = {}

    for (const conv of list) {
      if (!conv.fb_page_id || !conv.fb_client_id) continue

      /** Composite key */
      const id = `${conv.fb_page_id}_${conv.fb_client_id}`

      /** Lấy bản ghi hiện tại trong DB */
      const existing = await db.conversations.get(id)

      /** Nếu chưa có hoặc last_message_time trong file mới hơn, lưu/update */
      if (
        !existing ||
        (conv.last_message_time || 0) > (existing.last_message_time || 0)
      ) {
        updatedRecords[id] = { ...conv, id }
      }
    }

    /** Bulk put các bản ghi cần cập nhật */
    if (size(updatedRecords)) {
      await db.saveMany(updatedRecords)
      console.log(`✅ Updated ${size(updatedRecords)} records in IndexedDB`)
    } else {
      console.log('✅ No new updates, IndexedDB is up to date')
    }

    /** Cập nhật last_update nếu có bản ghi mới */
    if (size(updatedRecords)) {
      await db.meta.put({ key: 'last_update', value: Date.now() })
    }

    return list
  } catch (e) {
    console.error('Failed to load zip:', e)
    return []
  }
}
