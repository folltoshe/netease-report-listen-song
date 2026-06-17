import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { buildSessId, buildSidRefer } from '@root/mobile/session'

export const buildAi = (ctx: MobileContext): LogData => {
  return {
    _actseq: 2,
    _hsrefer: '[F:62][p][2][53][page_mine|page_main][:::|:::]',
    _refer_type: 's',
    _sessid: buildSessId(ctx),
    _sidrefer: buildSidRefer(ctx),
    androidid: ctx.device.androidId,
    brand: ctx.device.brand,
    carrier: ctx.device.networkOperator,
    device: ctx.device.name,
    imei: 'null',
    is_emulator: '0',
    // 未知字段，先置空
    libra_abt: '',
    logtime: Date.now(),
    oaid: ctx.device.oaid,
    pid: Number(ctx.app.pid),
    psrefer: '',
    skin: 1,
    source: ctx.app.channel,
  }
}
