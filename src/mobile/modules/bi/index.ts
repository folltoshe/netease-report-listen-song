import type { MobileContext } from '@root/mobile/context'
import type { LogData } from '@root/mobile/logger'

import { BaseLogger } from '@root/mobile/logger'

export * from './user_inter'

export class Logger extends BaseLogger {
  constructor(context: MobileContext) {
    super('bi', context)
  }

  override add(data: LogData, action: string, time?: number): this {
    return super.add({ ...this.commonKeys(), ...data }, action, time)
  }
}
