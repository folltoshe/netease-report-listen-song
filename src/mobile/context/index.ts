import type { BaseContext, AuthInfo, SongInfo } from '@root/common/context'

import type { MobileAppInfo } from './app'
import type { DeviceInfo } from './device'

export interface MobileContext extends BaseContext {
  app: MobileAppInfo
  device: DeviceInfo
}

export type { MobileAppInfo, DeviceInfo, AuthInfo, SongInfo }
