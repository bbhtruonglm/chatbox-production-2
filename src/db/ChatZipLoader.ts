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

    // --- Bulk get existing records để so sánh ---
    const ids = list
      .filter(c => c.fb_page_id && c.fb_client_id)
      .map(c => `${c.fb_page_id}_${c.fb_client_id}`)

    const existingList = await db.conversations.bulkGet(ids)
    const existingMap = _.keyBy(existingList, 'id')

    for (const conv of list) {
      if (!conv.fb_page_id || !conv.fb_client_id) continue
      const id = `${conv.fb_page_id}_${conv.fb_client_id}`
      const existing = existingMap[id]

      const convTime = conv.last_message_time || conv.create_at || 0
      const existingTime =
        existing?.last_message_time || existing?.create_at || 0

      if (!existing || convTime > existingTime) {
        updatedRecords[id] = { ...conv, id }
      }
    }

    // --- Bulk save và cập nhật last_update theo last_message_time lớn nhất ---
    if (size(updatedRecords)) {
      await db.saveMany(updatedRecords)
      const maxTime =
        _.max(
          Object.values(updatedRecords).map(
            c => c.last_message_time || c.create_at || 0
          )
        ) || Date.now()
      await db.meta.put({ key: 'last_update', value: maxTime })
      console.log(`✅ Updated ${size(updatedRecords)} records in IndexedDB`)
    } else {
      console.log('✅ No new updates, IndexedDB is up to date')
    }

    return list
  } catch (e) {
    console.error('Failed to load zip:', e)
    return []
  }
}
