import ImageResizeWorker from './image-resize.worker?worker'
import type {
  IContextResizeImage,
  IResizeImageResult,
} from './image-resize.worker'

/**pending của worker */
type IPending = {
  /**callback khi xử lý thành công */
  resolve: (r: IResizeImageResult) => void
  /**callback khi xử lý thất bại */
  reject: (r: IResizeImageResult) => void
}

/**worker để thay đổi kích thước ảnh */
let WORKER: Worker
/**
 * pending của worker
 * - thủ thuật để await được đúng hình ảnh của onmessage của worker
 */
const PENDINGS = new Map<string, IPending>()

/**
 * lấy worker để thay đổi kích thước ảnh
 * - lưu ý: chỉ new worker 1 lần duy nhất, tránh ảnh hưởng hiệu năng
 */
function getResizeImageWorker(): Worker {
  // nếu đã có worker rồi thì trả về luôn
  if (WORKER) return WORKER

  // nếu chưa có worker thì mới khởi tạo
  WORKER = new ImageResizeWorker()

  console.log('new worker')

  // lắng nghe sự kiện từ worker
  WORKER.onmessage = ({ data }: MessageEvent<IResizeImageResult>) => {
    // lấy dữ liệu cần thiết
    const { id: ID, error: ERROR } = data

    // nếu không có id thì bỏ qua
    if (!ID) return

    /**pending hiện tại */
    const CURRENT_PENDDING = PENDINGS.get(ID)

    // nếu không có pending thì bỏ qua
    if (!CURRENT_PENDDING) return

    // xóa pending khỏi danh sách
    PENDINGS.delete(ID)

    // nếu có lỗi thì reject
    if (ERROR) CURRENT_PENDDING.reject(data)
    // nếu không có lỗi thì resolve
    else CURRENT_PENDDING.resolve(data)
  }

  // trả về worker
  return WORKER
}

/**thay đổi kích thước ảnh */
export async function resizeImage(
  context: IContextResizeImage,
): Promise<IResizeImageResult> {
  // nếu không có id thì khởi tạo
  if(!context.id) context.id = crypto.randomUUID()

  // trả về promise resize hình ảnh
  return new Promise(async (resolve, reject) => {
    /**lấy worker */
    const WORKER = getResizeImageWorker()

    /**thêm pending vào danh sách */
    PENDINGS.set(context.id!, { resolve, reject })

    /**gửi context đến worker */
    WORKER.postMessage(context)
  })
}
