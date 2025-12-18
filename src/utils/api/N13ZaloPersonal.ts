import { Botx } from '@/utils/api/Botx'

/**gọi API lên server n13 zalo cá nhân */
export class N13ZaloPersonal extends Botx {
  constructor(path: string) {
    // gọi API lên server của chatbox
    super(`${$env.host.n13_zalo_personal}/${path}`)
  }
}