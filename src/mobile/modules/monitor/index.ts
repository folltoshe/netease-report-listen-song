import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { BaseLogger } from '@root/mobile/logger'

export class Logger extends BaseLogger {
  constructor(context: MobileContext) {
    super('monitor', context)
  }

  override add(data: LogData, action: string, time?: number): this {
    return super.add(
      {
        ...this.commonKeys(),
        pid: Number(this.context.app.pid),
        ...data,
      },
      action,
      time
    )
  }
}
