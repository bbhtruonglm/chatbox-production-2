import { Botx } from '@/utils/api/Botx'
// ================================ N6Static V2 ================================ //

// ---------------------------------- CLASS ---------------------------------- //
/**gọi API lên server n6 của chatbox */
export class N6StaticV2 extends Botx {

  constructor(path: string) {
    // gọi API lên server của chatbox
    super(`${$env.host.n6_static}/${path}`)

    // tự động nạp id tổ chức đang chọn
    this.initSelectedOrgId()
  }
  /**đính kèm dữ liệu mặc định lên toàn bộ API upload */
  protected get(
    path: string,
    qs?: Record<string, any>
  ): Promise<any> {
    return super.get(
      path,
      qs
    )
  }

  /** phương thức put */
  protected put(
    path: string,
    body?: any,
    headers?: any,
    qs?: Record<string, any>
  ): Promise<any> {
    return super.customRequest({
      is_form: true,
      is_json: false,
      method: 'PUT',
      path,
      qs,
      body,
      headers
    })
  }
}
// ========================== N6StaticAppUploadFile ========================== //

// -------------------------------- INTERFACE -------------------------------- //
/**kết quả upload file */
interface UploadRes {
  /**link của file */
  file_url: string
  /** link để update file */
  upload_url: string
}

// ---------------------------------- CLASS ---------------------------------- //
export class N6StaticAppUploadFileV2 extends N6StaticV2 {
  constructor() {
    // gọi API module upload
    super('app/upload/s3')
  }

  /** hàm lấy link upload file tạm */
  async getUploadTempFileUrl(data: {
    /** tên file */
    file_name: string
    /** loại của file */
    content_type: string
  }): Promise<UploadRes> {
    return await this.get('get_upload_temp_file_url', {
      file_name: data.file_name,
      content_type: data.content_type
    })
  }

  /** hàm upload file tạm */
  async uploadTempFile(data: {
    /** tên file */
    file: File | Blob,
    /** url upload file */
    upload_url: string
  }) {
    return await this.put(data.upload_url, data.file, {
      'Content-Type': data.file.type || 'application/octet-stream'
    })
  }
}