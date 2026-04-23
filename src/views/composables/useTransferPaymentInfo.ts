import { size } from 'lodash'

import type { IBankAccount } from '@/utils/api/N4Service/Partner'

/** tham số tính toán thông tin chuyển khoản */
interface ITransferPaymentInfoParams {
  is_issue_invoice?: boolean
  is_pay_partner?: boolean
  partner_info?: IBankAccount
}

/** thông tin chuyển khoản mặc định của công ty */
export const BBH_TCB: IBankAccount = {
  bank_bin: 970422,
  account: '228269999',
  name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ BOT BÁN HÀNG',
  bank: 'Ngân hàng TMCP Quân đội (MBBank)',
  code: 'BBH_TCB',
}

/** dùng chung logic chọn tài khoản chuyển khoản */
export function useTransferPaymentInfo() {
  /** tính toán thông tin chuyển khoản */
  function calcPaymentInfo(
    params?: ITransferPaymentInfoParams
  ): IBankAccount {
    const { is_pay_partner, is_issue_invoice, partner_info } = params ?? {}

    // nếu không phải đối tác HOẶC cần xuất hóa đơn HOẶC không có thông tin đối tác
    // thì mặc định trả về tài khoản công ty
    if (!is_pay_partner || is_issue_invoice || !size(partner_info)) {
      return BBH_TCB
    }

    // trường hợp còn lại: trả về thông tin đối tác
    return partner_info || BBH_TCB
  }

  return {
    BBH_TCB,
    calcPaymentInfo,
  }
}
