import type { AppInfo } from '@root/common/context'

export interface DesktopAppInfo extends AppInfo {
  // WEVNSM
  nsm: string
  // WNMCID
  cid: string
  // channel, netease
  channel: string
  // version, 3.1.35.205293
  version: string
}
