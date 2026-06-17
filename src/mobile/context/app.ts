import type { AppInfo } from '@root/common/context'

export interface MobileAppInfo extends AppInfo {
  // MUSIC_A_T
  at: string
  // MUSIC_R_T
  rt: string
  // Nm cid, NMCID
  cid: string
  // EVNSM
  nsm: string
}
