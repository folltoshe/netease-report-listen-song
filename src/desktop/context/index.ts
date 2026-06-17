import type { BaseContext, AuthInfo, SongInfo } from '@root/common/context'

import type { DesktopAppInfo } from './app'
import type { DesktopDeviceInfo } from './device'

export interface DesktopContext extends BaseContext {
  app: DesktopAppInfo
  device: DesktopDeviceInfo
}

export type { DesktopAppInfo, DesktopDeviceInfo, AuthInfo, SongInfo }
