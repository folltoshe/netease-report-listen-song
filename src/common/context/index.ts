import type { AppInfo } from './app'
import type { AuthInfo } from './auth'
import type { SongInfo } from './song'

export interface BaseContext {
  app: AppInfo
  auth: AuthInfo
  startTime: number
  processId: number
}

export type { AppInfo, AuthInfo, SongInfo }
