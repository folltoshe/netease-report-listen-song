import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { BaseLogger } from '@root/mobile/logger'

export * from './ai'

export * from './ac'

export * from './plv'

export * from './pld'

export class Logger extends BaseLogger {
  constructor(context: MobileContext) {
    super('ua', context)
  }

  override add(data: LogData, action: string, time?: number): this {
    return super.add(
      {
        ...this.commonKeys(),
        channel: this.context.app.channel,
        g_dprefer: '',
        screenType: 'other',
        ...data,
      },
      action,
      time
    )
  }
}
