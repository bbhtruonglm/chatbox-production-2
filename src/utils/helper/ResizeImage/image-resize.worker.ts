/// <reference lib="webworker" />

/**dữ liệu đầu vào khi resize ảnh */
export interface IContextResizeImage {
  /**id của context */
  id?: string
  /**file ảnh cần resize */
  file: File
  /**kích thước tối đa của ảnh */
  max_size?: number
  /**chất lượng của ảnh, càng thấp ảnh càng mờ (0 -> 1) */
  quality?: number
  /**loại ảnh */
  type?: string
}
/**kết quả sau khi resize ảnh */
export interface IResizeImageResult {
  /**id của context */
  id?: string
  /**file ảnh sau khi resize */
  blob?: Blob
  /**chiều rộng của ảnh sau khi resize */
  width?: number
  /**chiều cao của ảnh sau khi resize */
  height?: number
  /**có giữ nguyên kích thước không */
  unchanged?: boolean
  /**lỗi khi resize ảnh */
  error?: unknown
}

/**gửi kết quả về main thread */
function proceed(output: IResizeImageResult) {
  ;(self as any).postMessage(output)
}
/**thay đổi kích thước ảnh */
async function resizeImage({ data }: MessageEvent<IContextResizeImage>) {
  // lấy các dữ liệu cần thiết
  const {
    id: ID,
    file: FILE,
    max_size: MAX_SIZE = 500,
    quality: QUALITY = 0.8,
    type: TYPE = 'image/png',
  } = data

  try {
    /**tạo bitmap từ file */
    const BITMAP = await createImageBitmap(FILE)

    /**lấy kích thước gốc của ảnh */
    const { width: RAW_WIDTH, height: RAW_HEIGHT } = BITMAP

    /**nếu kích thước ảnh nhỏ hơn kích thước tối đa thì không cần resize */
    if (RAW_WIDTH <= MAX_SIZE && RAW_HEIGHT <= MAX_SIZE)
      return proceed({
        id: ID,
        blob: FILE,
        width: RAW_WIDTH,
        height: RAW_HEIGHT,
        unchanged: true,
      })

    /**tỉ lệ hình ảnh */
    const RATIO = Math.min(MAX_SIZE / RAW_WIDTH, MAX_SIZE / RAW_HEIGHT)
    /**độ rộng mới */
    const NEW_WIDTH = Math.round(RAW_WIDTH * RATIO)
    /**độ cao mới */
    const NEW_HEIGHT = Math.round(RAW_HEIGHT * RATIO)

    /**tạo canvas để vẽ ảnh với kích thước mới */
    const CANVAS = new (self as any).OffscreenCanvas(NEW_WIDTH, NEW_HEIGHT)

    /**lấy context của canvas */
    const CTX_CANVAS = CANVAS.getContext('2d')

    // nếu không thể lấy context thì ném lỗi
    if (!CTX_CANVAS) throw new Error('FAILD_TO_GET_CONTEXT_OF_CANVAS')

    // vẽ ảnh với kích thước mới
    CTX_CANVAS.drawImage(BITMAP, 0, 0, NEW_WIDTH, NEW_HEIGHT)

    /**tạo dữ liệu hình ảnh từ canvas */
    const IMAGE_BLOB = await CANVAS.convertToBlob({
      type: TYPE,
      quality: QUALITY,
    })

    /**gửi kết quả về main thread */
    proceed({
      id: ID,
      blob: IMAGE_BLOB,
      width: NEW_WIDTH,
      height: NEW_HEIGHT,
      unchanged: false,
    })
  } catch (e) {
    proceed({ id: ID, error: e })
  }
}

// lắng nghe sự kiện từ main thread
// lưu ý: worker chạy tuần tự theo từng message, không chạy song song
self.onmessage = resizeImage
