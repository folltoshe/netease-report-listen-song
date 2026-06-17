import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { buildSessId, buildSidRefer } from '@root/mobile/session'

export const buildAc = (ctx: MobileContext): LogData => {
  return {
    NPUInfo: 'UN',
    RichTapHigh: true,
    _hsrefer: '',
    _moved_unlogin_log_: 1,
    _sessid: buildSessId(ctx),
    _sidrefer: buildSidRefer(ctx),
    appicon: -1,
    board: ctx.device.board,
    cpuName: ctx.device.cpuName,
    downsetup: '320k',
    flowfree: 0,
    imei: 'null',
    isPad: false,
    isvipdynamiceffect: '0',
    isvipskin: '0',
    isvipsoundeffect: '0',
    // 未知字段，先置空
    libra_abt: '',
    logtime: Date.now(),
    oaid: ctx.device.oaid,
    permission: '0',
    pid: Number(ctx.app.pid),
    playsetup: '320k',
    psrefer: '',
    skin: 1,
    soundeffect: '0',
    viptype: ctx.auth.vipType,
  }
}
