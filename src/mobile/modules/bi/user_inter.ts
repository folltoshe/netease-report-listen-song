import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

export const buildUserInter = (ctx: MobileContext): LogData => {
  return {
    _moved_unlogin_log_: 1,
    libra_abt:
      '1.0.0_3_16563_61839#1781617664585,1.0.0_3_15296_60814#1781617664612,1.0.0_3_14904_56071#1781617664470,1.0.0_3_17449_64840#1781617664691,1.0.0_3_16075_60174#1781617664694,1.0.0_3_2639_11189#1781617664761',
    pid: Number(ctx.app.pid),
    sessionid: 1,
  }
}
