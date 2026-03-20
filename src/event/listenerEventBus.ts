import { onMounted, onBeforeUnmount as onUnmount } from 'vue'
import type { Handler } from 'mitt'
import emitter from './eventBus'

/**
 * Lắng nghe sự kiện từ event bus, tự động hủy lắng nghe khi component unmounted
 * @param event tên sự kiện
 * @param handler hàm xử lý sự kiện
 */
export function listenerEventBus(event: string, handler: Handler<unknown>) {
  // khi component mounted thì lắng nghe sự kiện
  onMounted(() => {
    emitter.on(event, handler)
  })

  // khi component unmounted thì hủy lắng nghe sự kiện
  onUnmount(() => {
    emitter.off(event, handler)
  })
}
