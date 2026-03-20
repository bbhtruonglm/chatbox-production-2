import emitter from './eventBus'

/**
 * Gửi sự kiện đến event bus
 * @param event tên sự kiện
 * @param payload dữ liệu gửi đi
 */
export function dispatchEventBus(event: string, payload: unknown) {
  emitter.emit(event, payload)
}
